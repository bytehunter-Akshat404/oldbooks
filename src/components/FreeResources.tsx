import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BookListing } from '../types';
import { FileText, Download, BookOpen, Search, Filter, LayoutGrid, List, FileCheck } from 'lucide-react';

export default function FreeResources() {
  const [resources, setResources] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'books'), where('isDonation', '==', true));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookListing));
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(search.toLowerCase()) ||
    res.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Free Resources</h1>
          <p className="text-gray-500">Access educational materials, PDFs, and donated books for free.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
          ))
        ) : filteredResources.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No free resources yet</h3>
            <p className="text-gray-500">Check back later for new study materials.</p>
          </div>
        ) : (
          filteredResources.map(res => (
            <div key={res.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {res.pdfUrl ? <FileCheck className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {res.pdfUrl ? 'Digital PDF' : 'Physical Copy'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{res.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{res.author}</p>
              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">{res.category}</span>
                {res.pdfUrl ? (
                  <a
                    href={res.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-indigo-600 font-bold text-sm hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                ) : (
                  <span className="text-xs font-bold text-green-600">Available for Pickup</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
