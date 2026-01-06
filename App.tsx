
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientData, PrayerTimeRow } from './types';
import { toAr, formatPrayerTime, getRamadanDay } from './utils/arabicUtils';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';

const RAMADAN_START_1447 = new Date('2026-02-18T00:00:00');

const App: React.FC = () => {
  const [client, setClient] = useState<ClientData | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      
      // الحصول على الـ slug من مسار الرابط (Pathname)
      const pathParts = window.location.pathname.split('/').filter(p => p);
      const slugFromPath = pathParts[0];
      
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('s');
      
      const targetSlug = slugFromPath || querySlug;

      console.log("Checking for slug:", targetSlug);

      if (targetSlug && supabase) {
        try {
          const { data, error } = await supabase
            .from('links')
            .select('payload')
            .eq('slug', targetSlug.toLowerCase().trim())
            .single();

          if (data && data.payload) {
            // محاولة تحويل البيانات من JSON string إذا كانت مخزنة كنص
            const decodedData = typeof data.payload === 'string' 
              ? JSON.parse(data.payload) 
              : data.payload;
            setClient(decodedData as ClientData);
          } else {
            setClient({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
          }
        } catch (e) {
          console.error('Supabase fetch error:', e);
          setClient({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
        }
      } else {
        setClient({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
      }

      // وضع الإدارة: للدخول أضف ?admin=123 للرابط
      if (params.get('admin') === '123') {
        setIsAdminMode(true);
        console.log("Admin mode activated!");
      } else {
        console.log("To enter admin mode, add ?admin=123 to the URL");
      }
      setIsLoading(false);
    };

    initApp();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const diff = RAMADAN_START_1447.getTime() - now.getTime();
      
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerTimes = useMemo(() => {
    const rows: PrayerTimeRow[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(RAMADAN_START_1447);
      date.setDate(date.getDate() + i);
      const baseFajr = new Date(date); baseFajr.setHours(4, 55 - Math.floor(i/3), 0);
      const baseMaghrib = new Date(date); baseMaghrib.setHours(17, 45 + Math.floor(i/3), 0);
      rows.push({
        ramadanDay: i + 1, date,
        fajr: formatPrayerTime(baseFajr), sunrise: "", dhuhr: "", asr: "",
        maghrib: formatPrayerTime(baseMaghrib), isha: formatPrayerTime(new Date(baseMaghrib.getTime() + 75*60000))
      });
    }
    return rows;
  }, []);

  const currentRamadanDay = useMemo(() => getRamadanDay(currentTime, RAMADAN_START_1447), [currentTime]);
  const todayTimes = prayerTimes.find(t => t.ramadanDay === currentRamadanDay) || prayerTimes[0];

  const toggleRadio = useCallback(() => {
    const audio = document.getElementById('quran-audio') as HTMLAudioElement;
    if (audio.paused) { audio.play(); setIsRadioPlaying(true); } else { audio.pause(); setIsRadioPlaying(false); }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(217,119,6,0.3)]"></div>
        <p className="font-kufi text-xl text-amber-200 animate-pulse">جاري الاتصال بقاعدة البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-200 bg-[#fdfbf7]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-amber-100 no-print shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-amber-100 shadow-md">
              {client?.logo ? <img src={client.logo} className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🌙</span>}
            </div>
            <div>
              <h1 className="font-kufi text-lg text-indigo-950 font-bold leading-tight">{client?.name}</h1>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">رمضان ١٤٤٧ هـ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleRadio} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isRadioPlaying ? 'bg-amber-500 text-white' : 'bg-indigo-900 text-amber-400'}`}>
              {isRadioPlaying ? '⏸' : '▶'}
            </button>
            <audio id="quran-audio" src="https://n0e.radiojar.com/8s5u5tpdtwzuv"></audio>
            {isAdminMode && (
              <button onClick={() => setShowAdmin(true)} className="w-10 h-10 rounded-full bg-indigo-900 text-amber-400 flex items-center justify-center shadow-lg hover:rotate-90 transition-all">⚙️</button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
        <header className="relative bg-gradient-to-br from-indigo-950 to-indigo-800 rounded-[3rem] p-10 md:p-16 text-white mb-10 shadow-2xl overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {client?.logo && (
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <img src={client.logo} alt="Logo" className="max-h-24 object-contain" />
              </div>
            )}
            <h2 className="font-amiri text-xl md:text-3xl text-amber-200 mb-4 font-bold italic drop-shadow-md">{client?.name} يهنئكم بالشهر الفضيل</h2>
            <h3 className="font-kufi text-5xl md:text-7xl mb-10 text-white drop-shadow-lg">رمضان كريم</h3>
            
            <div className="flex justify-center gap-4 bg-black/30 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-inner">
              {[{l:'يوم',v:timeLeft.d},{l:'ساعة',v:timeLeft.h},{l:'دقيقة',v:timeLeft.m},{l:'ثانية',v:timeLeft.s}].map((it,i)=>(
                <div key={i} className="flex flex-col items-center px-2 md:px-4"><span className="text-2xl md:text-4xl font-black text-amber-400 tabular-nums">{toAr(it.v)}</span><span className="text-[9px] uppercase font-bold text-indigo-100">{it.l}</span></div>
              ))}
            </div>
          </div>
        </header>

        {/* Stats and Table sections remain same for functionality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 no-print">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-50 flex justify-between items-center group">
            <div><p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">فجر اليوم</p><p className="text-3xl font-black text-indigo-950">{toAr(todayTimes.fajr)}</p></div>
            <span className="text-4xl group-hover:scale-110 transition-all">🌅</span>
          </div>
          <div className="bg-amber-600 text-white p-8 rounded-[2rem] shadow-xl scale-105 flex justify-between items-center group">
            <div><p className="text-[10px] text-amber-100 font-bold mb-1 uppercase tracking-tighter">إفطار اليوم</p><p className="text-4xl font-black">{toAr(todayTimes.maghrib)}</p></div>
            <span className="text-4xl group-hover:scale-110 transition-all">🌙</span>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-50 flex justify-between items-center group">
            <div><p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">اليوم الهجري</p><p className="text-3xl font-black text-indigo-950">{toAr(Math.max(1, currentRamadanDay))} رمضان</p></div>
            <span className="text-4xl group-hover:scale-110 transition-all">📅</span>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-amber-100">
          <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
            <h4 className="font-kufi text-xl font-bold text-indigo-950">مواقيت الصلاة - {client?.city}</h4>
            <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-950 text-amber-400 rounded-xl font-bold text-xs shadow-lg no-print">طباعة الإمساكية 🖨️</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-indigo-950 text-amber-300">
                  <th className="py-4 px-8 text-sm">رمضان</th>
                  <th className="py-4 px-8 text-center text-sm">الفجر</th>
                  <th className="py-4 px-8 text-center bg-amber-600/10 text-amber-700 text-sm">المغرب</th>
                  <th className="py-4 px-8 text-center text-sm">العشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prayerTimes.map((row) => (
                  <tr key={row.ramadanDay} className={`hover:bg-slate-50 transition-all ${row.ramadanDay === currentRamadanDay ? 'bg-amber-50/50 border-r-4 border-amber-600' : ''}`}>
                    <td className="py-4 px-8 font-black text-indigo-950">{toAr(row.ramadanDay)}</td>
                    <td className="py-4 px-8 text-center font-medium">{toAr(row.fajr)}</td>
                    <td className="py-4 px-8 text-center font-black text-amber-600 bg-amber-50/20">{toAr(row.maghrib)}</td>
                    <td className="py-4 px-8 text-center text-slate-400 text-xs">{toAr(row.isha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Social Footer */}
      <footer className="bg-indigo-950 text-white py-16 no-print text-center mt-auto border-t-4 border-amber-500">
        <div className="container mx-auto px-4 max-w-3xl">
          <h5 className="font-kufi text-2xl text-amber-400 mb-8 tracking-widest italic">تواصلوا مع {client?.name}</h5>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[
              { k: 'whatsapp', u: client?.whatsapp ? `https://wa.me/${client.whatsapp}` : '', i: '💬', c: 'bg-emerald-600' },
              { k: 'phone', u: client?.phone ? `tel:${client.phone}` : '', i: '📞', c: 'bg-blue-600' },
              { k: 'maps', u: client?.maps || '', i: '📍', c: 'bg-red-600' },
              { k: 'facebook', u: client?.facebook || '', i: '👤', c: 'bg-blue-800' },
              { k: 'instagram', u: client?.instagram || '', i: '📸', c: 'bg-pink-600' },
              { k: 'tiktok', u: client?.tiktok || '', i: '🎵', c: 'bg-black' },
              { k: 'snapchat', u: client?.snapchat || '', i: '👻', c: 'bg-yellow-400 text-black' },
            ].filter(s => s.u && s.u.length > 5).map((s) => (
              <a key={s.k} href={s.u} target="_blank" className={`w-14 h-14 ${s.c} rounded-2xl flex items-center justify-center hover:scale-110 transition-all text-2xl shadow-xl`}>{s.i}</a>
            ))}
          </div>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.5em]">جميع الحقوق محفوظة {client?.name} © ١٤٤٧ هـ</p>
        </div>
      </footer>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;
