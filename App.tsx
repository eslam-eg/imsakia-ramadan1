
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientData, PrayerTimeRow } from './types';
import { toAr, formatPrayerTime, getRamadanDay } from './utils/arabicUtils';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';

const RAMADAN_START_1447 = new Date('2026-02-18T00:00:00');

const App: React.FC = () => {
  const [client, setClient] = useState<ClientData>({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const initApp = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        // التحقق من وضع الإدارة
        if (params.get('admin') === '123') {
          setIsAdminMode(true);
        }

        // جلب الـ slug
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const targetSlug = pathParts[0] || params.get('s');

        if (targetSlug && supabase) {
          const { data, error } = await supabase
            .from('links')
            .select('payload')
            .eq('slug', targetSlug.toLowerCase().trim())
            .single();

          if (data && data.payload) {
            const decoded = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            setClient(decoded);
            document.title = `إمساكية رمضان - ${decoded.name}`;
          }
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsLoading(false);
      }
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
      <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-kufi text-amber-200 animate-pulse text-lg">تحميل الإمساكية البركة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-100 no-print shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-amber-100 shadow-sm">
              {client.logo ? <img src={client.logo} className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🌙</span>}
            </div>
            <div>
              <h1 className="font-kufi text-base md:text-lg text-indigo-950 font-bold">{client.name}</h1>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">رمضان ١٤٤٧ هـ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleRadio} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isRadioPlaying ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-900 text-amber-400'}`}>
              {isRadioPlaying ? '⏸' : '▶'}
            </button>
            <audio id="quran-audio" src="https://n0e.radiojar.com/8s5u5tpdtwzuv" crossOrigin="anonymous"></audio>
            {isAdminMode && (
              <button onClick={() => setShowAdmin(true)} className="w-10 h-10 rounded-full bg-indigo-900 text-amber-400 flex items-center justify-center shadow-lg hover:bg-black transition-colors">
                ⚙️
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-5xl flex-grow">
        <header className="relative bg-gradient-to-br from-indigo-950 to-indigo-800 rounded-[2.5rem] p-8 md:p-14 text-white mb-8 shadow-2xl overflow-hidden text-center border-b-4 border-amber-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="font-amiri text-lg md:text-2xl text-amber-200 mb-2 font-bold italic">{client.name} يهنئكم</h2>
            <h3 className="font-kufi text-4xl md:text-6xl mb-8 text-white drop-shadow-lg">رمضان كريم</h3>
            
            <div className="flex justify-center gap-3 bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-inner">
              {[{l:'يوم',v:timeLeft.d},{l:'ساعة',v:timeLeft.h},{l:'دقيقة',v:timeLeft.m},{l:'ثانية',v:timeLeft.s}].map((it,i)=>(
                <div key={i} className="flex flex-col items-center px-3"><span className="text-xl md:text-3xl font-black text-amber-400 tabular-nums">{toAr(it.v)}</span><span className="text-[9px] font-bold text-indigo-100 uppercase">{it.l}</span></div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-50 flex justify-between items-center">
            <div><p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">الفجر</p><p className="text-2xl font-black text-indigo-950">{toAr(todayTimes.fajr)}</p></div>
            <span className="text-3xl">🌅</span>
          </div>
          <div className="bg-amber-600 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center transform scale-105">
            <div><p className="text-[10px] text-amber-100 font-bold mb-1 uppercase">المغرب (الإفطار)</p><p className="text-3xl font-black">{toAr(todayTimes.maghrib)}</p></div>
            <span className="text-3xl animate-pulse">🌙</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-50 flex justify-between items-center">
            <div><p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">التاريخ</p><p className="text-2xl font-black text-indigo-950">{toAr(Math.max(1, currentRamadanDay))} رمضان</p></div>
            <span className="text-3xl">📅</span>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-amber-100">
          <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
            <h4 className="font-kufi text-lg font-bold text-indigo-950">مواقيت الصلاة - {client.city}</h4>
            <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-indigo-950 rounded-lg font-bold text-xs hover:bg-slate-50 no-print transition-colors">طباعة 🖨️</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-indigo-950 text-amber-400">
                  <th className="py-4 px-6 text-xs">رمضان</th>
                  <th className="py-4 px-6 text-center text-xs">الفجر</th>
                  <th className="py-4 px-6 text-center bg-amber-500/10 text-amber-700 text-xs">المغرب</th>
                  <th className="py-4 px-6 text-center text-xs">العشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prayerTimes.map((row) => (
                  <tr key={row.ramadanDay} className={`hover:bg-amber-50/30 transition-colors ${row.ramadanDay === currentRamadanDay ? 'bg-amber-50/50 border-r-4 border-amber-600 font-bold' : ''}`}>
                    <td className="py-4 px-6 text-indigo-950 font-black">{toAr(row.ramadanDay)}</td>
                    <td className="py-4 px-6 text-center">{toAr(row.fajr)}</td>
                    <td className="py-4 px-6 text-center text-amber-700 bg-amber-500/5">{toAr(row.maghrib)}</td>
                    <td className="py-4 px-6 text-center text-slate-400 text-[10px]">{toAr(row.isha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-indigo-950 text-white py-12 no-print text-center border-t-4 border-amber-500">
        <div className="container mx-auto px-4 max-w-4xl">
          <h5 className="font-kufi text-xl text-amber-400 mb-6 tracking-widest">تواصلوا معنا</h5>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { k: 'whatsapp', u: client.whatsapp ? `https://wa.me/${client.whatsapp}` : '', i: '💬', c: 'bg-emerald-600' },
              { k: 'phone', u: client.phone ? `tel:${client.phone}` : '', i: '📞', c: 'bg-blue-600' },
              { k: 'maps', u: client.maps || '', i: '📍', c: 'bg-red-600' },
              { k: 'facebook', u: client.facebook || '', i: '👤', c: 'bg-blue-800' },
              { k: 'instagram', u: client.instagram || '', i: '📸', c: 'bg-pink-600' },
              { k: 'tiktok', u: client.tiktok || '', i: '🎵', c: 'bg-black' },
              { k: 'snapchat', u: client.snapchat || '', i: '👻', c: 'bg-yellow-400 text-black' },
            ].filter(s => s.u && s.u.length > 5).map((s) => (
              <a key={s.k} href={s.u} target="_blank" className={`w-12 h-12 ${s.c} rounded-xl flex items-center justify-center hover:scale-110 transition-transform text-xl shadow-lg`}>{s.i}</a>
            ))}
          </div>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">جميع الحقوق محفوظة © ١٤٤٧ هـ</p>
        </div>
      </footer>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;
