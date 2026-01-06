
import React, { useState } from 'react';
import { ClientData } from '../types';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<ClientData>({
    name: '',
    logo: '',
    phone: '',
    whatsapp: '',
    maps: '',
    facebook: '',
    tiktok: '',
    snapchat: '',
    instagram: '',
    city: 'القاهرة'
  });

  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveToSupabase = async () => {
    if (!formData.name || !slug) {
      alert('⚠️ يرجى إدخال اسم العميل والاسم المختصر للرابط (Slug)');
      return;
    }

    // تنظيف الـ slug ليكون صالحاً للروابط
    const cleanSlug = slug.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    setIsSaving(true);
    try {
      // حفظ البيانات في جدول links بحقل payload كـ JSON string
      const { error } = await supabase
        .from('links')
        .upsert({ 
          slug: cleanSlug, 
          payload: JSON.stringify(formData) 
        }, { onConflict: 'slug' });

      if (error) throw error;

      // توليد الرابط النظيف domain.com/slug
      const finalUrl = `${window.location.origin}/${cleanSlug}`;
      setGeneratedLink(finalUrl);
      alert('✅ تم حفظ البيانات في قاعدة البيانات وتوليد الرابط المختصر!');
    } catch (err: any) {
      console.error(err);
      alert('❌ فشل الحفظ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('✅ تم نسخ الرابط بنجاح!');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-indigo-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-amber-200">
        
        <div className="p-8 bg-gradient-to-r from-indigo-950 to-indigo-800 text-white flex justify-between items-center border-b-4 border-amber-500">
          <div>
            <h2 className="font-kufi text-2xl font-bold italic tracking-wide text-amber-400">لوحة الإدارة - نظام الروابط المختصرة</h2>
            <p className="text-xs text-indigo-200 opacity-80">أنشئ إمساكية احترافية لعملائك بروابط سهلة</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-all text-2xl">✕</button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/50">
          <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
            <h3 className="text-sm font-black text-indigo-900 mb-4 border-r-4 border-amber-500 pr-3 uppercase">المعرف المختصر (Slug)</h3>
            <div className="flex gap-2">
              <span className="bg-slate-100 px-4 py-4 rounded-2xl text-slate-400 font-mono text-sm border">/{window.location.host}/</span>
              <input 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 border-2 border-indigo-50 p-4 rounded-2xl focus:border-amber-500 outline-none font-mono text-indigo-900" 
                placeholder="اسم-النشاط" 
              />
            </div>
            <p className="text-[10px] text-indigo-400 mt-2 font-bold pr-2">سيصبح الرابط: {window.location.origin}/{slug || 'slug'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">اسم المؤسسة</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full border-2 border-slate-100 p-4 rounded-2xl focus:border-amber-500 outline-none bg-white shadow-sm" placeholder="اسم العميل" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">رابط اللوجو</label>
              <input name="logo" value={formData.logo} onChange={handleChange} className="w-full border-2 border-slate-100 p-4 rounded-2xl focus:border-amber-500 outline-none bg-white shadow-sm" placeholder="URL مباشر للصورة" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-indigo-900 mb-2 border-r-4 border-emerald-500 pr-3 uppercase">بيانات التواصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-emerald-500 bg-white" placeholder="واتساب" />
              <input name="phone" value={formData.phone} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-blue-500 bg-white" placeholder="الهاتف" />
              <input name="maps" value={formData.maps} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-red-500 bg-white" placeholder="خرائط جوجل" />
              <input name="facebook" value={formData.facebook} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-blue-700 bg-white" placeholder="فيسبوك" />
              <input name="instagram" value={formData.instagram} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-pink-500 bg-white" placeholder="إنستجرام" />
              <input name="tiktok" value={formData.tiktok} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-black bg-white" placeholder="تيك توك" />
              <input name="snapchat" value={formData.snapchat} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-yellow-400 bg-white" placeholder="سناب شات" />
              <select name="city" value={formData.city} onChange={handleChange} className="border-2 p-4 rounded-2xl focus:border-indigo-500 bg-white shadow-sm">
                <option value="القاهرة">القاهرة</option>
                <option value="الإسكندرية">الإسكندرية</option>
                <option value="الرياض">الرياض</option>
                <option value="دبي">دبي</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleSaveToSupabase} 
            disabled={isSaving}
            className={`w-full py-5 rounded-3xl font-bold text-xl shadow-2xl transition-all active:scale-95 ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-900 text-amber-400 hover:bg-black'}`}
          >
            {isSaving ? '⏳ جاري الحفظ...' : '🚀 حفظ وإنشاء الرابط المختصر'}
          </button>

          {generatedLink && (
            <div className="p-8 bg-amber-50 border-4 border-amber-200 rounded-[3rem] text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <p className="text-sm font-black text-amber-900">✨ الرابط الخاص بالعميل جاهز الآن:</p>
              <div className="bg-white p-4 rounded-2xl border-2 border-amber-100 text-indigo-900 font-mono text-sm break-all shadow-inner">{generatedLink}</div>
              <button 
                onClick={copyToClipboard}
                className="bg-emerald-600 text-white px-12 py-3 rounded-full font-bold shadow-xl hover:bg-emerald-700 flex items-center justify-center gap-3 mx-auto"
              >
                <span>📋</span>
                <span>نسخ الرابط</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
