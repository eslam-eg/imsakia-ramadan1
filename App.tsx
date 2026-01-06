
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
      // مثال: domain.com/foursa سيعيد 'foursa'
      const pathParts = window.location.pathname.split('/').filter(p => p);
      const slugFromPath = pathParts[0];
      
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('s'); // دعم احتياطي لـ ?s=slug
      
      const targetSlug = slugFromPath || querySlug;

      if (targetSlug && supabase) {
        try {
          // جلب الـ payload من جدول links بناءً على الـ slug
          const { data, error } = await supabase
            .from('links')
            .select('payload')
            .eq('slug', targetSlug.toLowerCase().trim())
            .single();

          if (data && data.payload) {
            const decodedData = JSON.parse(data.payload) as ClientData;
            setClient(decodedData);
          } else {
            console.log("Slug not found in database:", targetSlug);
            setClient({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
          }
        } catch (e) {
          console.error('Supabase fetch error:', e);
          setClient({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
        }
      } else {
        // العودة للوضع الافتراضي في حال عدم وجود slug
        setClient({ name: 'إمساكية رمضان الذكية', city: 'القاهرة' });
      }

      // وضع الإدارة
      if (params.get('admin') === '123') {
        setIsAdminMode(true);
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
      <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 border-8 border-amber-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(217,119,6,0.5)]"></div>
        <p className="font-kufi text-2xl text-amber-200 animate-pulse">جاري تحميل بيانات الإمساكية...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-200 bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-amber-100 no-print shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-2 border-amber-100 shadow-lg">
              {client?.logo ? <img src={client.logo} className="w-full h-full object-contain p-1" /> : <span className="text-3xl">🌙</span>}
            </div>
            <div>
              <h1 className="font-kufi text-xl text-indigo-950 font-bold leading-tight">{client?.name}</h1>
              <p className="text-[10px] text-amber-600 font-bold tracking-widest uppercase">رمضان ١٤٤٧ هـ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleRadio} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${isRadioPlaying ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-900 text-amber-400'}`}>
              {isRadioPlaying ? '⏸' : '▶'}
            </button>
            <audio id="quran-audio" src="https://n0e.radiojar.com/8s5u5tpdtwzuv"></audio>
            {isAdminMode && (
              <button onClick={() => setShowAdmin(true)} className="p-3 rounded-2xl bg-indigo-900 text-amber-400 border border-amber-500/30 hover:rotate-180 transition-all">⚙️</button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
        <header className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 rounded-[4rem] p-12 md:p-20 text-white mb-12 shadow-[0_40px_80px_-20px_rgba(30,27,75,0.6)] overflow-hidden text-center border-4 border-white/5 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {client?.logo && (
              <div className="mb-10 p-6 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl">
                <img src={client.logo} alt="Logo" className="max-h-32 object-contain" />
              </div>
            )}
            <h2 className="font-amiri text-2xl md:text-4xl text-amber-200 mb-6 font-bold italic drop-shadow-lg">{client?.name} يهنئكم بالشهر الفضيل</h2>
            <h3 className="font-kufi text-6xl md:text-9xl mb-14 text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]">رمضان كريم</h3>
            
            <div className="flex flex-wrap justify-center gap-6 bg-black/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
              {[{l:'يوم',v:timeLeft.d},{l:'ساعة',v:timeLeft.h},{l:'دقيقة',v:timeLeft.m},{l:'ثانية',v:timeLeft.s}].map((it,i)=>(
                <div key={i} className="flex flex-col min-w-[90px]"><span className="text-4xl md:text-6xl font-black text-amber-400 tabular-nums">{toAr(it.v)}</span><span className="text-[10px] uppercase font-bold text-indigo-100 tracking-[0.4em]">{it.l}</span></div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 no-print px-2">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-indigo-100 flex justify-between items-center group hover:-translate-y-2 transition-all">
            <div><p className="text-[10px] text-slate-400 font-bold mb-2 tracking-widest uppercase">فجر اليوم</p><p className="text-4xl font-black text-indigo-950 tabular-nums">{toAr(todayTimes.fajr)}</p></div>
            <span className="text-5xl group-hover:rotate-12 transition-all">🌅</span>
          </div>
          <div className="bg-amber-600 text-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(217,119,6,0.4)] scale-110 flex justify-between items-center relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] text-amber-100 font-bold mb-2 tracking-widest uppercase">إفطار اليوم</p>
              <p className="text-5xl font-black tabular-nums">{toAr(todayTimes.maghrib)}</p>
            </div>
            <span className="text-5xl relative z-10 animate-pulse">🌙</span>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-indigo-100 flex justify-between items-center group hover:-translate-y-2 transition-all">
            <div><p className="text-[10px] text-slate-400 font-bold mb-2 tracking-widest uppercase">اليوم الهجري</p><p className="text-4xl font-black text-indigo-950 tabular-nums">{toAr(Math.max(1, currentRamadanDay))} رمضان</p></div>
            <span className="text-5xl group-hover:-rotate-12 transition-all">📅</span>
          </div>
        </div>

        <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border-2 border-amber-50">
          <div className="p-10 bg-slate-50/50 border-b-2 flex flex-wrap gap-6 justify-between items-center">
            <h4 className="font-kufi text-3xl font-bold text-indigo-950 border-r-8 border-amber-500 pr-4">مواقيت الصلاة - {client?.city}</h4>
            <button onClick={() => window.print()} className="px-10 py-4 bg-indigo-950 text-amber-400 rounded-full font-bold text-sm shadow-2xl hover:bg-black transition-all no-print">طباعة الإمساكية 🖨️</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-indigo-950 text-amber-300">
                  <th className="py-6 px-12 text-lg">رمضان</th>
                  <th className="py-6 px-12 text-center text-lg">الفجر</th>
                  <th className="py-6 px-12 text-center bg-amber-600 text-white text-lg">المغرب</th>
                  <th className="py-6 px-12 text-center text-lg">العشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {prayerTimes.map((row) => (
                  <tr key={row.ramadanDay} className={`hover:bg-slate-50 transition-all ${row.ramadanDay === currentRamadanDay ? 'bg-amber-50 border-r-[12px] border-amber-600' : ''}`}>
                    <td className="py-6 px-12 font-black text-2xl text-indigo-950">{toAr(row.ramadanDay)}</td>
                    <td className="py-6 px-12 text-center text-xl font-medium tabular-nums">{toAr(row.fajr)}</td>
                    <td className="py-6 px-12 text-center font-black text-amber-700 bg-amber-500/5 text-2xl tabular-nums">{toAr(row.maghrib)}</td>
                    <td className="py-6 px-12 text-center text-xl font-medium tabular-nums">{toAr(row.isha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Social Footer */}
      <footer className="bg-indigo-950 text-white py-20 no-print text-center border-t-8 border-amber-500">
        <div className="container mx-auto px-4 max-w-5xl">
          <h5 className="font-kufi text-4xl text-amber-400 mb-10 tracking-widest italic">تواصلوا مع {client?.name}</h5>
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {[
              { k: 'whatsapp', u: client?.whatsapp ? `https://wa.me/${client.whatsapp}` : '', i: '💬', color: 'bg-emerald-600' },
              { k: 'phone', u: client?.phone ? `tel:${client.phone}` : '', i: '📞', color: 'bg-blue-600' },
              { k: 'maps', u: client?.maps || '', i: '📍', color: 'bg-red-600' },
              { k: 'facebook', u: client?.facebook || '', i: '👤', color: 'bg-blue-800' },
              { k: 'instagram', u: client?.instagram || '', i: '📸', color: 'bg-gradient-to-tr from-yellow-500 to-purple-600' },
              { k: 'tiktok', u: client?.tiktok || '', i: '🎵', color: 'bg-black border border-white/20' },
              { k: 'snapchat', u: client?.snapchat || '', i: '👻', color: 'bg-yellow-400 !text-black' },
            ].filter(s => s.u && s.u.length > 5).map((s) => (
              <a key={s.k} href={s.u} target="_blank" className={`w-20 h-20 ${s.color} rounded-[2rem] flex items-center justify-center hover:scale-125 hover:rotate-12 transition-all text-4xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-b-4 border-black/20`}>{s.i}</a>
            ))}
          </div>
          <div className="pt-10 border-t border-white/10">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.8em]">جميع الحقوق محفوظة {client?.name} © ١٤٤٧ هـ</p>
          </div>
        </div>
      </footer>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;
