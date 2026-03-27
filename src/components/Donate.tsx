import { useState, useRef, FormEvent } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { BookImages, BookListing } from '../types';
import { Heart, Camera, X, CheckCircle, Package, FileText, Upload, Plus } from 'lucide-react';

export default function Donate() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [donationType, setDonationType] = useState<'physical' | 'pdf'>('physical');
  const [newBook, setNewBook] = useState<Partial<BookListing>>({
    title: '',
    author: '',
    price: 0,
    category: 'Class 9',
    status: 'available',
    isDonation: true,
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

  const handleDonate = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (donationType === 'physical' && (!images.front || !images.back || !images.side || !images.open)) {
      alert("Please capture all 4 required images for physical donation.");
      return;
    }

    setLoading(true);
    try {
      if (!auth.currentUser) {
        alert("You need to sign in with Google or Email to donate books. Guest mode is for browsing only.");
        setLoading(false);
        return;
      }
      const bookData = {
        ...newBook,
        sellerId: auth.currentUser.uid,
        images: donationType === 'physical' ? images : { front: '', back: '', side: '', open: '' },
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'books'), bookData);
      setSuccess(true);
      setNewBook({
        title: '',
        author: '',
        price: 0,
        category: 'Class 9',
        status: 'available',
        isDonation: true,
      });
      setImages({ front: '', back: '', side: '', open: '' });
    } catch (error) {
      console.error("Error donating book:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Your Kindness!</h1>
        <p className="text-gray-500 max-w-md mb-8">
          Your donation has been listed. Someone in need will benefit from your generosity.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          Donate Another Book
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-600">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donate a Book</h1>
        <p className="text-gray-500">Help others by sharing your old books or digital resources.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setDonationType('physical')}
            className={`py-4 font-bold text-sm uppercase tracking-widest transition-all ${
              donationType === 'physical' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            Physical Book
          </button>
          <button
            onClick={() => setDonationType('pdf')}
            className={`py-4 font-bold text-sm uppercase tracking-widest transition-all ${
              donationType === 'pdf' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            Digital PDF
          </button>
        </div>

        <form onSubmit={handleDonate} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Book Title</label>
                <input
                  required
                  type="text"
                  value={newBook.title}
                  onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-600 outline-none font-medium"
                  placeholder="e.g. Concepts of Physics"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Author</label>
                <input
                  required
                  type="text"
                  value={newBook.author}
                  onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-600 outline-none font-medium"
                  placeholder="e.g. H.C. Verma"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Category</label>
                <select
                  value={newBook.category}
                  onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-600 outline-none font-medium"
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
              {donationType === 'pdf' && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">PDF Link (Google Drive/Dropbox)</label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="url"
                      value={newBook.pdfUrl}
                      onChange={e => setNewBook({ ...newBook, pdfUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-600 outline-none font-medium"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>
              )}
            </div>

            {donationType === 'physical' && (
              <div className="space-y-6">
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Upload Images (All 4 required)</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['front', 'back', 'side', 'open'] as const).map(type => (
                    <div key={type} className="relative group">
                      <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300">
                        {images[type] ? (
                          <img src={images[type]} alt={type} className="w-full h-full object-cover" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startCamera(type)}
                            className="flex flex-col items-center text-gray-400 group-hover:text-indigo-600"
                          >
                            <Camera className="w-6 h-6 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{type} View</span>
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
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                <span>Donate Now</span>
              </>
            )}
          </button>
        </form>
      </div>

      {capturing && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-2xl rounded-3xl shadow-2xl mb-8" />
          <div className="flex space-x-6">
            <button
              onClick={captureImage}
              className="w-20 h-20 bg-white rounded-full border-8 border-gray-300 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-full" />
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
