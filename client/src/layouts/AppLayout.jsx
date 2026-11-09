import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AlarmClock, LayoutDashboard, CalendarDays, ChartNoAxesColumn, Moon, Settings, Plus, LogOut, Sun, Menu, X, Bell, Volume2, Vibrate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useAlarmWatcher from '../hooks/useAlarmWatcher';
import MissionModal from '../components/MissionModal';
import { formatTime } from '../pages/Dashboard';
import { recordChallengeResult } from '../services/alarmService';

const links = [['/dashboard','Overview',LayoutDashboard],['/alarms','Alarms',AlarmClock],['/reminders','Reminders',CalendarDays],['/insights','Insights',ChartNoAxesColumn],['/sleep','Sleep mode',Moon],['/settings','Settings',Settings]];

function AlarmAudio({ ringing }) {
  useEffect(() => {
    if (!ringing) return;
    let context, soundTimer, vibrationTimer;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) {
        context = new Context();
        const notes = { Sunrise: [660, 880], Gentle: [440, 554], Classic: [784, 659], Digital: [880, 440], Nature: [523, 659] };
        let index = 0;
        const beep = () => { if (!context || context.state === 'closed') return; const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = notes[ringing.sound]?.[index++ % 2] || 660; gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.04); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.5); };
        context.resume().then(beep).catch(() => {}); soundTimer = setInterval(beep, 950);
      }
    } catch {}
    if (ringing.vibration && navigator.vibrate) vibrationTimer = setInterval(() => navigator.vibrate([450, 180, 450]), 1300);
    return () => { clearInterval(soundTimer); clearInterval(vibrationTimer); navigator.vibrate?.(0); context?.close().catch(() => {}); };
  }, [ringing]);
  return null;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [flowStarted, setFlowStarted] = useState(false);
  const [resultError, setResultError] = useState('');
  const navigate = useNavigate();
  const { ringing, snooze, stop } = useAlarmWatcher();
  const configured = ringing?.challenges?.length ? ringing.challenges : ringing?.mission?.enabled ? [{ type: ringing.mission.type, duration: ringing.mission.duration || 60 }] : [];
  const challenges = [...configured, ...(ringing?.physicalActivities || []).map(activity => ({ type: 'physical', activity }))];
  const challenge = challenges[challengeIndex];
  const startStopFlow = () => { if (challenges.length) { if (!flowStarted) { setChallengeIndex(0); setFlowStarted(true); } setResultError(''); setMissionOpen(true); } else stop(); };
  const completeChallenge = async result => {
    setResultError('');
    const resultType = result?.challengeType || challenge?.type;
    const goal = result?.target || challenge?.activity?.target || challenge?.steps || challenge?.duration || 1;
    const report = result || { challengeType: resultType, target: goal, actualValue: goal, unit: 'challenge', metadata: { detectionMethod: 'challenge-completed' } };
    try { await recordChallengeResult(ringing._id, { ...report, sessionId: ringing.sessionId }); }
    catch (error) { setResultError(error.response?.data?.message || 'Could not save this challenge result. Check your connection and try again.'); return; }
    if (challengeIndex + 1 < challenges.length) setChallengeIndex(index => index + 1);
    else { setMissionOpen(false); setChallengeIndex(0); setFlowStarted(false); await stop(); }
  };

  return <div className="app-shell">
    <AlarmAudio ringing={ringing && !missionOpen ? ringing : null}/>
    <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sun size={19}/></div><div><b>JAGRITI</b><small>Wake. Remember. Grow.</small></div><button className="icon-btn mobile-close" onClick={() => setOpen(false)}><X/></button></div>
      <div className="nav-label">MENU</div><nav>{links.map(([to,label,Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span>{label === 'Reminders' && <span className="nav-dot"/>}</NavLink>)}</nav>
      <button className="sidebar-add" onClick={() => navigate('/alarms/new')}><Plus size={17}/> Create an alarm</button>
      <div className="sidebar-bottom"><div className="mini-tip"><span className="tip-icon">✦</span><b>A gentler morning</b><p>Small routines make brighter days.</p></div><button className="profile" onClick={() => navigate('/settings')}><div className="avatar">{user?.name?.[0]?.toUpperCase() || 'J'}</div><div className="profile-name"><b>{user?.name || 'Your account'}</b><small>Personal space</small></div><span className="icon-btn logout" role="button" aria-label="Log out" onClick={e => { e.stopPropagation(); logout(); }}><LogOut size={17}/></span></button></div>
    </aside>
    <main className="main"><header className="mobile-header"><button className="icon-btn" onClick={() => setOpen(true)}><Menu/></button><div className="brand-mini"><Sun size={18}/> JAGRITI</div><button className="icon-btn" onClick={() => navigate('/reminders')}><Bell size={18}/></button></header><Outlet/></main>
    <nav className="bottom-nav">{links.slice(0,5).map(([to,label,Icon]) => <NavLink key={to} to={to} aria-label={label}><Icon size={19}/><small>{label === 'Overview' ? 'Home' : label}</small></NavLink>)}</nav>
    {ringing && <div className="ring-screen"><div className="ring-brand"><Sun size={20}/> JAGRITI</div><div className="ring-center"><div className="ring-pulse"><AlarmClock size={27}/></div><p className="eyebrow">TIME TO BEGIN</p><div className="ring-time">{formatTime(ringing.time)}</div><h1>{ringing.label || 'Wake up'}</h1><p>It’s time to start your day.</p><div className="ring-badges"><span><Volume2 size={14}/>{ringing.sound}</span>{ringing.vibration && <span><Vibrate size={14}/>Vibration</span>}</div></div><div className="ring-actions"><button className="btn snooze-btn" onClick={snooze}>Snooze · {ringing.snoozeDuration} min</button><button className="btn stop-btn" onClick={startStopFlow}>{challenges.length ? 'Start wake-up challenges' : 'Stop alarm'}</button></div></div>}
    {missionOpen && challenge && <MissionModal type={challenge.type} activity={challenge.activity} duration={challenge.duration || 60} steps={challenge.steps} label={challenge.label} onClose={() => setMissionOpen(false)} onComplete={completeChallenge} submissionError={resultError} stepLabel={challenges.length > 1 ? `Challenge ${challengeIndex + 1} of ${challenges.length}` : null}/>}
  </div>;
}
