import { useState, useEffect, useRef, FormEvent } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { BookListing, BookImages } from '../types';
import { Plus, Camera, Trash2, CheckCircle, Clock, Package, Image as ImageIcon, X } from 'lucide-react';

export default function SellerDashboard() {
  const [books, setBooks] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState<Partial<BookListing>>({
    title: '',
    author: '',
    price: 0,
    category: 'Class 9',
    board: 'CBSE',
    class: '9',
    status: 'available',
    isDonation: false,
  });
  const [images, setImages] = useState<BookImages>({
    front: '',
    back: '',
    side: '',
    open: '',
  });
  const [capturing, setCapturing] = useState<keyof BookImages | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'books'), where('sellerId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const booksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookListing));
      setBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (type: keyof BookImages) => {
    setCapturing(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCapturing(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && capturing) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImages(prev => ({ ...prev, [capturing]: dataUrl }));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCapturing(null);
  };

  const handleAddBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("You need to sign in with Google or Email to list books. Guest mode is for browsing only.");
      return;
    }

    // Validate images
    if (!images.front || !images.back || !images.side || !images.open) {
      alert("Please capture all 4 required images.");
      return;
    }

    try {
      const bookData = {
        ...newBook,
        sellerId: auth.currentUser.uid,
        images,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'books'), bookData);
      setShowAddForm(false);
      setNewBook({
        title: '',
        author: '',
        price: 0,
        category: 'Class 9',
        board: 'CBSE',
        class: '9',
        status: 'available',
        isDonation: false,
      });
      setImages({ front: '', back: '', side: '', open: '' });
      fetchBooks();
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await deleteDoc(doc(db, 'books', id));
        fetchBooks();
      } catch (error) {
        console.error("Error deleting book:", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-500">Manage your book listings and sales.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>List New Book</span>
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl border border-gray-100">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6">List a New Book</h2>
            <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                  <input
                    required
                    type="text"
                    value={newBook.title}
                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    required
                    type="text"
                    value={newBook.author}
                    onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                      required
                      type="number"
                      value={newBook.price}
                      onChange={e => setNewBook({ ...newBook, price: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newBook.category}
                      onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option>Class 9</option>
                      <option>Class 10</option>
                      <option>Class 11</option>
                      <option>Class 12</option>
                      <option>JEE/NEET</option>
                      <option>Competitive Exams</option>
                      <option>Language Books</option>
                      <option>Novels</option>
                      <option>Previous Year Papers</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDonation"
                    checked={newBook.isDonation}
                    onChange={e => setNewBook({ ...newBook, isDonation: e.target.checked, price: e.target.checked ? 0 : newBook.price })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isDonation" className="text-sm font-medium text-gray-700">This is a donation (Free)</label>
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-sm font-medium text-gray-700">Upload Images (All 4 required)</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['front', 'back', 'side', 'open'] as const).map(type => (
                    <div key={type} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden">
                        {images[type] ? (
                          <img src={images[type]} alt={type} className="w-full h-full object-cover" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startCamera(type)}
                            className="flex flex-col items-center text-gray-400 group-hover:text-indigo-600"
                          >
                            <Camera className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium uppercase">{type} View</span>
                          </button>
                        )}
                      </div>
                      {images[type] && (
                        <button
                          type="button"
                          onClick={() => setImages(prev => ({ ...prev, [type]: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  List Book for Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {capturing && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-2xl rounded-2xl shadow-2xl mb-8" />
          <div className="flex space-x-6">
            <button
              onClick={captureImage}
              className="w-20 h-20 bg-white rounded-full border-8 border-gray-300 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-full" />
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))
        ) : books.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No books listed yet</h3>
            <p className="text-gray-500">Start by listing your first old book for sale.</p>
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative aspect-[4/3]">
                <img src={book.images.front} alt={book.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {book.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-gray-500">{book.author}</p>
                  </div>
                  <span className="font-bold text-indigo-600">₹{book.price}</span>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{book.category}</span>
                  {book.isDonation && <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded font-bold">Donation</span>}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
