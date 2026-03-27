import { useState, useEffect, FormEvent } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { BookListing, Offer } from '../types';
import { Search, Filter, BookOpen, IndianRupee, MessageCircle, ChevronRight, LayoutGrid, List, Tag, GraduationCap, Languages, Trophy, FileText, Heart } from 'lucide-react';

export default function BuyerDashboard() {
  const [books, setBooks] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedBook, setSelectedBook] = useState<BookListing | null>(null);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [offerLoading, setOfferLoading] = useState(false);

  const categories = [
    { name: 'All', icon: LayoutGrid },
    { name: 'Class 9', icon: GraduationCap },
    { name: 'Class 10', icon: GraduationCap },
    { name: 'Class 11', icon: GraduationCap },
    { name: 'Class 12', icon: GraduationCap },
    { name: 'JEE/NEET', icon: Trophy },
    { name: 'Competitive Exams', icon: Trophy },
    { name: 'Language Books', icon: Languages },
    { name: 'Novels', icon: BookOpen },
    { name: 'Previous Year Papers', icon: FileText },
  ];

  useEffect(() => {
    fetchBooks();
  }, [category]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'books'), where('status', '==', 'available'));
      if (category !== 'All') {
        q = query(collection(db, 'books'), where('status', '==', 'available'), where('category', '==', category));
      }
      const querySnapshot = await getDocs(q);
      const booksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookListing));
      setBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedBook) {
      if (!auth.currentUser) {
        alert("You need to sign in with Google or Email to make offers. Guest mode is for browsing only.");
      }
      return;
    }

    setOfferLoading(true);
    try {
      const offer: Partial<Offer> = {
        bookId: selectedBook.id,
        buyerId: auth.currentUser.uid,
        sellerId: selectedBook.sellerId,
        offeredPrice: offerPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'offers'), offer);
      alert("Offer sent successfully!");
      setSelectedBook(null);
      setOfferPrice(0);
    } catch (error) {
      console.error("Error making offer:", error);
    } finally {
      setOfferLoading(false);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Explore Books</h1>
          <p className="text-gray-500">Find your next read or study material at a great price.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              category === cat.name
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
          ))
        ) : filteredBooks.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No books found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          filteredBooks.map(book => (
            <div key={book.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={book.images.front} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    book.isDonation ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {book.isDonation ? 'Donation' : 'For Sale'}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                  <p className="text-xs text-gray-500">{book.author}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-tighter">Price</span>
                    <span className="text-lg font-black text-gray-900">₹{book.price}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBook(book);
                      setOfferPrice(book.price);
                    }}
                    className="flex items-center space-x-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-200"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Bargain</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex flex-col md:flex-row h-full">
              <div className="w-full md:w-1/2 bg-gray-100">
                <div className="grid grid-cols-2 gap-1 h-full">
                  <img src={selectedBook.images.front} className="w-full h-full object-cover aspect-square" alt="front" />
                  <img src={selectedBook.images.back} className="w-full h-full object-cover aspect-square" alt="back" />
                  <img src={selectedBook.images.side} className="w-full h-full object-cover aspect-square" alt="side" />
                  <img src={selectedBook.images.open} className="w-full h-full object-cover aspect-square" alt="open" />
                </div>
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="self-end p-2 text-gray-400 hover:text-gray-600 mb-4"
                >
                  <Filter className="w-6 h-6 rotate-45" />
                </button>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedBook.title}</h2>
                  <p className="text-gray-500 font-medium">{selectedBook.author}</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Original Price</span>
                    <span className="font-bold text-gray-900">₹{selectedBook.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Category</span>
                    <span className="font-bold text-gray-900">{selectedBook.category}</span>
                  </div>
                </div>

                <form onSubmit={handleMakeOffer} className="mt-auto space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Your Offer Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={offerPrice}
                        onChange={e => setOfferPrice(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-600 outline-none font-bold text-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={offerLoading}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {offerLoading ? 'Sending...' : 'Send Bargain Offer'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
