import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldAlert, Activity, BarChart3, Truck, 
  Leaf, Thermometer, Droplets, Clock, Target, ShieldCheck, 
  Camera, LineChart, Package, CheckCircle2, ChevronRight, Menu
} from 'lucide-react';

const LandingPage = () => {
  // Smooth scroll helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-landing-bg text-landing-text-primary font-sans overflow-x-hidden selection:bg-landing-mint-200 selection:text-landing-text-primary">
      
      {/* 1. Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-landing-surface/90 backdrop-blur-md border border-landing-border rounded-full px-6 py-3 flex items-center justify-between z-50 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-landing-mint-500 to-landing-mint-700 flex items-center justify-center text-white font-bold shadow-sm">
            P
          </div>
          <span className="font-bold text-lg tracking-tight">ProducePilot</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-landing-text-secondary">
          <button onClick={() => scrollToSection('how-it-works')} className="hover:text-landing-text-primary transition-colors">How It Works</button>
          <button onClick={() => scrollToSection('agents')} className="hover:text-landing-text-primary transition-colors">AI Agents</button>
          <button onClick={() => scrollToSection('technology')} className="hover:text-landing-text-primary transition-colors">Technology</button>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/app" className="hidden md:flex items-center justify-center px-5 py-2.5 bg-landing-text-primary text-white rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm">
            Open Dashboard
          </Link>
          <button className="md:hidden text-landing-text-primary">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-landing-mint-100 to-transparent rounded-full blur-[100px] -z-10 opacity-60"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-landing-mint-100 text-landing-mint-700 text-sm font-medium mb-4 shadow-sm border border-landing-mint-200">
            <ShieldCheck size={16} />
            <span>AI-POWERED FRESH PRODUCE OPERATIONS</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Stop <span className="text-landing-mint-700">spoilage</span><br />
            before it becomes waste.
          </h1>
          
          <p className="text-lg md:text-xl text-landing-text-secondary max-w-2xl mx-auto leading-relaxed">
            ProducePilot helps fresh produce operations detect risk, understand quality,
            forecast demand, and turn at-risk inventory into actionable rescue decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={() => scrollToSection('how-it-works')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-landing-teal-500 to-landing-teal-700 text-white rounded-full font-medium hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              Explore the Platform
              <ArrowRight size={18} />
            </button>
            <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-white text-landing-text-primary border border-landing-border rounded-full font-medium hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm">
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 2b. Hero Product Visual */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-landing-surface rounded-[24px] p-8 md:p-12 shadow-[0_20px_40px_rgba(15,23,42,0.06)] border border-landing-border relative overflow-hidden">
            {/* Inner Dashboard Concept */}
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 space-y-6 z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-landing-mint-100 flex items-center justify-center text-landing-mint-700">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-xl font-bold">ProducePilot Intelligence</h3>
                </div>
                
                <div className="bg-landing-bg rounded-2xl p-6 border border-landing-border">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs font-semibold text-landing-text-secondary uppercase tracking-wider mb-1">Active Batch</p>
                      <p className="text-lg font-bold">Mangoes (B-2026-0006)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-landing-text-secondary uppercase tracking-wider mb-1">Spoilage Risk</p>
                      <p className="text-2xl font-bold text-red-500">91.2%</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-red-500 h-2 rounded-full w-[91%]"></div>
                  </div>
                  <p className="text-sm font-medium text-red-500">Remaining: &lt; 1 day</p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-4 relative z-10 w-full">
                <div className="flex gap-4">
                  <div className="flex-1 bg-landing-blue-100/50 p-4 rounded-2xl border border-landing-blue-200 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Package size={16} className="text-blue-600"/></div>
                    <span className="text-sm font-medium">Inventory Agent</span>
                  </div>
                  <div className="flex-1 bg-landing-mint-100/50 p-4 rounded-2xl border border-landing-mint-200 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Camera size={16} className="text-landing-mint-700"/></div>
                    <span className="text-sm font-medium">Vision Agent</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-landing-pink-100/50 p-4 rounded-2xl border border-landing-pink-200 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><LineChart size={16} className="text-pink-600"/></div>
                    <span className="text-sm font-medium">Demand Agent</span>
                  </div>
                  <div className="flex-1 bg-landing-mint-100/50 p-4 rounded-2xl border border-landing-mint-200 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Truck size={16} className="text-landing-mint-700"/></div>
                    <span className="text-sm font-medium">Rescue Agent</span>
                  </div>
                </div>
                
                <div className="mt-4 bg-landing-text-primary text-white p-5 rounded-2xl flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Recommended Action</p>
                    <p className="font-medium">Dispatch to viable destination</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-full">
                    <ArrowRight size={20} className="text-landing-mint-500" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-landing-mint-100 rounded-full blur-[80px] -z-0 opacity-50"></div>
          </div>
        </div>
      </section>

      {/* 3. Problem */}
      <section className="py-24 px-6 bg-white border-y border-landing-border" id="problem">
        <div className="max-w-5xl mx-auto text-center space-y-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Fresh produce has a shrinking decision window.
          </h2>
          
          <div className="relative">
            {/* Horizontal timeline line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
            <div className="hidden md:block absolute top-1/2 left-0 w-[80%] h-1 bg-gradient-to-r from-gray-300 via-landing-mint-500 to-red-400 -translate-y-1/2 rounded-full z-0"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-0 relative z-10">
              {['HARVEST', 'STORAGE', 'QUALITY CHANGES', 'RISK RISES', 'DECISION WINDOW', 'WASTE'].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                    ${i < 3 ? 'bg-white border border-gray-200 text-gray-400' : 
                      i === 4 ? 'bg-landing-mint-100 border-landing-mint-500 border-2 text-landing-mint-700 w-16 h-16 shadow-md' : 
                      i === 5 ? 'bg-red-50 border border-red-200 text-red-500' : 
                      'bg-white border border-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider text-center
                    ${i === 4 ? 'text-landing-mint-700' : i === 5 ? 'text-red-500' : 'text-landing-text-secondary'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-landing-bg p-8 rounded-[24px] inline-flex flex-col md:flex-row items-center gap-6 md:gap-12 border border-landing-border shadow-sm">
            <span className="text-landing-text-secondary font-medium">The ProducePilot Intervention:</span>
            <div className="flex items-center gap-3 md:gap-6 font-bold text-sm md:text-base text-landing-text-primary">
              <span>HARVEST</span>
              <ChevronRight size={16} className="text-landing-mint-500" />
              <span className="text-landing-mint-700">MONITOR</span>
              <ChevronRight size={16} className="text-landing-mint-500" />
              <span className="text-landing-mint-700">PREDICT</span>
              <ChevronRight size={16} className="text-landing-mint-500" />
              <span className="text-landing-mint-700">ACT</span>
              <ChevronRight size={16} className="text-landing-mint-500" />
              <span className="text-white bg-landing-text-primary px-4 py-1.5 rounded-full shadow-md">RESCUE</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">From risk detection to rescue.</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-[24px] p-8 border border-landing-border shadow-[0_8px_24px_rgba(15,23,42,0.04)] relative">
              <div className="text-5xl font-black text-landing-mint-100 absolute top-6 right-6 select-none">01</div>
              <div className="w-12 h-12 bg-landing-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 relative z-10"><Activity size={24}/></div>
              <h3 className="text-xl font-bold mb-3 relative z-10">DETECT</h3>
              <p className="text-landing-text-secondary leading-relaxed relative z-10">Continuously evaluate inventory conditions and identify batches moving toward spoilage.</p>
            </div>
            
            <div className="bg-white rounded-[24px] p-8 border border-landing-border shadow-[0_8px_24px_rgba(15,23,42,0.04)] relative">
              <div className="text-5xl font-black text-landing-mint-100 absolute top-6 right-6 select-none">02</div>
              <div className="w-12 h-12 bg-landing-mint-100 rounded-xl flex items-center justify-center text-landing-mint-700 mb-6 relative z-10"><Camera size={24}/></div>
              <h3 className="text-xl font-bold mb-3 relative z-10">UNDERSTAND</h3>
              <p className="text-landing-text-secondary leading-relaxed relative z-10">Combine storage data with visual quality signals to understand what is actually happening to the produce.</p>
            </div>
            
            <div className="bg-white rounded-[24px] p-8 border border-landing-border shadow-[0_8px_24px_rgba(15,23,42,0.04)] relative">
              <div className="text-5xl font-black text-landing-mint-100 absolute top-6 right-6 select-none">03</div>
              <div className="w-12 h-12 bg-landing-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6 relative z-10"><Target size={24}/></div>
              <h3 className="text-xl font-bold mb-3 relative z-10">DECIDE</h3>
              <p className="text-landing-text-secondary leading-relaxed relative z-10">Evaluate shelf life, transit viability, demand and destination capacity.</p>
            </div>
            
            <div className="bg-white rounded-[24px] p-8 border border-landing-border shadow-[0_8px_24px_rgba(15,23,42,0.04)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-landing-mint-100/50 to-transparent"></div>
              <div className="text-5xl font-black text-landing-mint-200 absolute top-6 right-6 select-none">04</div>
              <div className="w-12 h-12 bg-landing-text-primary rounded-xl flex items-center justify-center text-white mb-6 relative z-10"><Truck size={24}/></div>
              <h3 className="text-xl font-bold mb-3 relative z-10">RESCUE</h3>
              <p className="text-landing-text-secondary leading-relaxed relative z-10">Recommend the best next action before the batch loses its commercial value.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Four AI Agents */}
      <section className="py-24 px-6 bg-white border-y border-landing-border overflow-hidden" id="agents">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Four specialized agents.<br/>One operational loop.</h2>
            <p className="text-landing-text-secondary text-lg">Each agent handles a specific part of the decision process. Together they turn produce data into action.</p>
          </div>
          
          <div className="relative">
            {/* Center connector label */}
            <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-landing-text-primary text-white px-6 py-2 rounded-full font-semibold text-sm shadow-xl z-20 items-center gap-2 tracking-wide">
              PRODUCEPILOT INTELLIGENCE LAYER
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 lg:gap-12 relative z-10">
              
              {/* Agent 1 */}
              <div className="bg-landing-bg rounded-[24px] p-8 border border-landing-border hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-landing-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Package size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Inventory Agent</h3>
                    <p className="text-landing-text-secondary font-medium">"Knows what is at risk."</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-landing-border space-y-3">
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Active Batch</span><span className="font-semibold">Tomatoes B-0178</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Storage Temp</span><span className="font-semibold">15°C</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Humidity</span><span className="font-semibold">90.2%</span></div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100"><span className="text-gray-500">Computed Risk</span><span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">High (84%)</span></div>
                </div>
              </div>

              {/* Agent 2 */}
              <div className="bg-landing-bg rounded-[24px] p-8 border border-landing-border hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-landing-mint-100 text-landing-mint-700 rounded-2xl flex items-center justify-center shadow-sm">
                    <Camera size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Vision Agent</h3>
                    <p className="text-landing-text-secondary font-medium">"Sees what the data can't."</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-landing-border space-y-3">
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Source Image</span><span className="font-semibold text-blue-600">scan_img_92.jpg</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Ripeness</span><span className="font-semibold text-orange-500">Overripe</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Defects</span><span className="font-semibold text-red-500">Mold, Bruising</span></div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100"><span className="text-gray-500">Condition Score</span><span className="font-bold text-red-500">15 / 100</span></div>
                </div>
              </div>

              {/* Agent 3 */}
              <div className="bg-landing-bg rounded-[24px] p-8 border border-landing-border hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-landing-pink-100 text-pink-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <LineChart size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Demand Agent</h3>
                    <p className="text-landing-text-secondary font-medium">"Knows where demand is moving."</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-landing-border space-y-3">
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Sales Trend</span><span className="font-semibold text-green-600">+12% WoW</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Local Forecast</span><span className="font-semibold">High Demand (Weekend)</span></div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100"><span className="text-gray-500">Demand Signal</span><span className="font-bold text-landing-mint-700 bg-landing-mint-100 px-2 py-0.5 rounded">Favorable</span></div>
                </div>
              </div>

              {/* Agent 4 */}
              <div className="bg-landing-bg rounded-[24px] p-8 border border-landing-border hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-landing-text-primary text-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Truck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Rescue Agent</h3>
                    <p className="text-landing-text-secondary font-medium">"Finds the next best destination."</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-landing-border space-y-3">
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Destination</span><span className="font-semibold">Hadapsar Wholesale</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Distance / Transit</span><span className="font-semibold">10.6 km / 36 min</span></div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100"><span className="text-gray-500">Recovered Value</span><span className="font-bold text-green-600">₹71,697</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. Product Preview */}
      <section className="py-24 px-6 bg-landing-bg" id="technology">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">An operations platform, not another AI chatbot.</h2>
            <p className="text-landing-text-secondary text-lg">Designed for warehouse operators, integrating real-time alerts, risk computation, and AI rescue recommendations into one cohesive dashboard.</p>
          </div>
          
          <div className="relative rounded-[24px] border border-landing-border bg-white shadow-[0_20px_40px_rgba(15,23,42,0.06)] overflow-hidden">
            {/* Fake browser header */}
            <div className="h-12 bg-gray-50 border-b border-landing-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="mx-auto bg-white border border-gray-200 rounded-md px-4 py-1 text-xs text-gray-400 w-64 text-center">produce-pilot.vercel.app/dashboard</div>
            </div>
            
            {/* Dashboard Mock Layout inside frame */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 bg-[#EDEEF1]">
              {/* Sidebar mock */}
              <div className="w-full md:w-56 bg-gradient-to-b from-landing-mint-500 to-landing-mint-700 rounded-2xl p-4 text-white shrink-0 hidden md:block shadow-md">
                <div className="font-bold text-lg mb-8 flex items-center gap-2"><div className="w-6 h-6 bg-white text-landing-mint-700 rounded flex items-center justify-center text-xs">P</div>ProducePilot</div>
                <div className="space-y-2">
                  <div className="bg-white text-landing-text-primary px-3 py-2 rounded-xl text-sm font-medium shadow-sm">Dashboard</div>
                  <div className="px-3 py-2 text-white/80 text-sm font-medium">Inventory</div>
                  <div className="px-3 py-2 text-white/80 text-sm font-medium">Agents</div>
                </div>
              </div>
              
              {/* Main content mock */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-landing-border relative">
                    <span className="absolute -top-3 -right-3 bg-landing-text-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">Inventory intelligence</span>
                    <div className="text-xs text-gray-500 font-semibold mb-1">TOTAL INVENTORY</div>
                    <div className="text-2xl font-bold">47,560 <span className="text-sm font-normal text-gray-400">kg</span></div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm relative">
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-landing-text-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">Risk computation</span>
                    <div className="text-xs text-red-500 font-semibold mb-1">AT RISK</div>
                    <div className="text-2xl font-bold text-red-600">31,004 <span className="text-sm font-normal text-red-400">kg</span></div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-landing-border hidden md:block">
                    <div className="text-xs text-gray-500 font-semibold mb-1">VALUE AT RISK</div>
                    <div className="text-2xl font-bold">₹16,15,325</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-landing-border hidden md:block">
                    <div className="text-xs text-gray-500 font-semibold mb-1">VALUE RESCUED</div>
                    <div className="text-2xl font-bold">₹70,840</div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-landing-border">
                    <h3 className="font-bold mb-4">Active Alerts</h3>
                    <div className="space-y-4 relative">
                      <span className="absolute top-1/2 -right-8 translate-x-full -translate-y-1/2 bg-landing-text-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10 hidden md:block">Rescue recommendation</span>
                      
                      <div className="flex items-center justify-between p-3 border border-red-100 bg-red-50/50 rounded-xl">
                        <div>
                          <div className="font-semibold text-sm">Tomatoes (B-2026-0006)</div>
                          <div className="text-xs text-gray-500">NCR Central Hub</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-red-500">Critical • 94%</div>
                          <div className="text-[10px] text-gray-500">2.2 days est.</div>
                        </div>
                        <button className="bg-landing-mint-700 text-white text-xs px-3 py-1.5 rounded-full font-medium">Accept</button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-yellow-100 bg-yellow-50/50 rounded-xl">
                        <div>
                          <div className="font-semibold text-sm">Bananas (B-2026-0188)</div>
                          <div className="text-xs text-gray-500">NCR Central Hub</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-yellow-600">High • 80%</div>
                          <div className="text-[10px] text-gray-500">1.8 days est.</div>
                        </div>
                        <button className="bg-landing-mint-700 text-white text-xs px-3 py-1.5 rounded-full font-medium">Accept</button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-landing-border relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-landing-text-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10 whitespace-nowrap">Agent activity</span>
                    <h3 className="font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <span className="text-landing-mint-700 font-semibold text-xs block mb-1">Vision Agent</span>
                        Graded image as Apples, conflicting with batch hint.
                      </div>
                      <div className="text-sm">
                        <span className="text-landing-mint-700 font-semibold text-xs block mb-1">Rescue Agent</span>
                        Recommended routing B-2026 to CIDCO Supermarket.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Risk Engine */}
      <section className="py-24 px-6 bg-white border-y border-landing-border">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Risk isn't guessed. It's computed.</h2>
            <p className="text-landing-text-secondary text-lg max-w-2xl mx-auto">ProducePilot combines harvest age, storage conditions and product-specific shelf life to calculate a transparent spoilage-risk score.</p>
          </div>
          
          <div className="bg-landing-bg p-8 rounded-[24px] border border-landing-border shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-x-auto">
            <div className="flex flex-nowrap md:flex-wrap items-center justify-center gap-4 text-sm font-semibold text-landing-text-primary min-w-[600px] md:min-w-0">
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">HARVEST AGE</div>
              <div className="text-landing-mint-500">+</div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">STORAGE TEMP</div>
              <div className="text-landing-mint-500">+</div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">HUMIDITY</div>
              <div className="text-landing-mint-500">+</div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">SHELF LIFE</div>
            </div>
            
            <div className="my-6 text-gray-300">
              <div className="w-0.5 h-8 bg-gray-300 mx-auto"></div>
              <ChevronRight size={20} className="mx-auto transform rotate-90 -mt-1 text-landing-mint-500" />
            </div>
            
            <div className="bg-landing-text-primary text-white px-8 py-3 rounded-full inline-block font-bold shadow-lg">
              SPOILAGE ENGINE
            </div>
            
            <div className="my-6 text-gray-300">
              <div className="w-0.5 h-8 bg-gray-300 mx-auto"></div>
              <ChevronRight size={20} className="mx-auto transform rotate-90 -mt-1 text-landing-mint-500" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-semibold">
              <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl border border-red-200 shadow-sm">RISK %</div>
              <div className="text-landing-text-secondary">+</div>
              <div className="bg-white text-landing-text-primary px-6 py-3 rounded-xl border border-gray-200 shadow-sm">EST. REMAINING LIFE</div>
            </div>
            
            <div className="mt-8 text-xs text-landing-text-secondary italic">Deterministic calculations establish risk. LLMs do not invent percentages.</div>
          </div>
        </div>
      </section>

      {/* 8. Computer Vision */}
      <section className="py-24 px-6 bg-landing-bg">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">See the condition, not just the inventory record.</h2>
            <p className="text-landing-text-secondary text-lg">
              Visual condition often deteriorates faster than predicted. The Vision Agent analyzes real photos to adjust the risk profile based on actual ripeness and visible defects.
            </p>
            <Link to="/app" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-landing-border text-landing-text-primary rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Explore Vision Analysis <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="bg-white p-6 rounded-[24px] border border-landing-border shadow-[0_20px_40px_rgba(15,23,42,0.06)] relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Camera className="text-landing-mint-700" size={24} />
                <h3 className="font-bold text-lg">Visual Assessment</h3>
              </div>
              
              <div className="aspect-video bg-gray-100 rounded-xl mb-6 overflow-hidden relative border border-gray-200 flex items-center justify-center">
                {/* Simulated Image bounding box */}
                <div className="absolute inset-4 border-2 border-dashed border-landing-mint-500 rounded-lg flex items-center justify-center bg-landing-mint-100/20">
                  <span className="text-landing-mint-700 font-semibold bg-white px-3 py-1 rounded-md text-sm shadow-sm">AI Analyzing...</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-landing-bg p-4 rounded-xl border border-landing-border text-center">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Ripeness</div>
                  <div className="text-lg font-bold text-red-500">Spoiled</div>
                </div>
                <div className="bg-landing-bg p-4 rounded-xl border border-landing-border text-center">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Defects</div>
                  <div className="text-sm font-semibold text-landing-text-primary leading-tight">Discoloration, Mold</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-landing-mint-200 rounded-full blur-[60px] -z-0"></div>
          </div>
        </div>
      </section>

      {/* 9. Rescue Intelligence */}
      <section className="py-24 px-6 bg-white border-y border-landing-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">When a batch is at risk, don't just alert. <span className="text-landing-mint-700">Act.</span></h2>
            <p className="text-landing-text-secondary text-lg">
              Deterministic calculations establish what destinations are viable based on transit time and shelf life. AI evaluates demand signals to recommend the most profitable rescue action.
            </p>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-landing-blue-100 to-landing-mint-100 rounded-[32px] transform rotate-3 scale-105 opacity-50"></div>
            <div className="bg-white p-8 rounded-[24px] border border-landing-border shadow-[0_20px_40px_rgba(15,23,42,0.08)] relative z-10">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recommended Destination</div>
              <h3 className="text-2xl font-bold text-landing-text-primary mb-6">Hadapsar Wholesale</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-landing-text-secondary">Transit Logic</span>
                  <span className="font-semibold">10.6 km • 36 min</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-landing-text-secondary">Arrival Risk Profile</span>
                  <span className="font-bold text-red-500">91.2%</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-landing-text-secondary">Exp. Recovered Value</span>
                  <span className="font-bold text-green-600 text-lg">₹71,697</span>
                </div>
              </div>
              
              <button className="w-full py-4 bg-landing-text-primary text-white rounded-xl font-bold hover:bg-black transition-colors flex justify-center items-center gap-2">
                Accept Rescue Plan <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11. The Decision Loop */}
      <section className="py-24 px-6 bg-landing-bg overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center space-y-16 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One system.<br/>The entire decision loop.</h2>
          
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-sm md:text-lg font-bold text-landing-text-secondary">
            <span className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-landing-text-primary">Inventory</span>
            <ArrowRight size={16} />
            <span className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-landing-text-primary">Risk</span>
            <ArrowRight size={16} />
            <span className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-landing-text-primary">Vision</span>
            <ArrowRight size={16} />
            <span className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-landing-text-primary">Demand</span>
            <ArrowRight size={16} />
            <span className="bg-landing-mint-100 text-landing-mint-700 px-4 py-2 rounded-full border border-landing-mint-200 shadow-sm">Rescue</span>
            <ArrowRight size={16} />
            <span className="bg-landing-text-primary text-white px-4 py-2 rounded-full shadow-md">Action</span>
          </div>
          
          <p className="text-landing-text-secondary italic">Continuous operations, not just one-time predictions.</p>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[40px] border-landing-mint-100 rounded-full opacity-30 -z-0"></div>
      </section>

      {/* 12. Why ProducePilot */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-landing-bg p-8 rounded-[24px] border border-landing-border hover:-translate-y-1 transition-transform">
              <h3 className="text-lg font-bold mb-3">REAL-TIME RISK</h3>
              <p className="text-landing-text-secondary text-sm leading-relaxed">Know exactly which batches need attention first based on deterministic calculations.</p>
            </div>
            <div className="bg-landing-bg p-8 rounded-[24px] border border-landing-border hover:-translate-y-1 transition-transform">
              <h3 className="text-lg font-bold mb-3">MULTIMODAL INTELLIGENCE</h3>
              <p className="text-landing-text-secondary text-sm leading-relaxed">Combine hard operational data with visual produce quality assessments.</p>
            </div>
            <div className="bg-landing-bg p-8 rounded-[24px] border border-landing-border hover:-translate-y-1 transition-transform">
              <h3 className="text-lg font-bold mb-3">ACTIONABLE AI</h3>
              <p className="text-landing-text-secondary text-sm leading-relaxed">Move past charts and predictions to concrete operational rescue recommendations.</p>
            </div>
            <div className="bg-landing-bg p-8 rounded-[24px] border border-landing-border hover:-translate-y-1 transition-transform">
              <h3 className="text-lg font-bold mb-3">AUDITABLE DECISIONS</h3>
              <p className="text-landing-text-secondary text-sm leading-relaxed">See the exact inputs, logic, and rationale behind every important system recommendation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 13. Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-landing-mint-500 to-landing-mint-700 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Turn perishable inventory<br/>into actionable decisions.</h2>
          <p className="text-lg text-white/90 max-w-xl mx-auto">
            See how ProducePilot connects risk, quality, demand and rescue into one operational intelligence layer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-landing-text-primary text-white rounded-full font-bold hover:bg-black transition-all shadow-xl">
              Open ProducePilot
            </Link>
            <button onClick={() => scrollToSection('how-it-works')} className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white hover:bg-white/20 rounded-full font-medium transition-all backdrop-blur-sm">
              Explore How It Works
            </button>
          </div>
        </div>
      </section>

      {/* 14. Footer */}
      <footer className="py-12 px-6 bg-white border-t border-landing-border text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-landing-mint-500 flex items-center justify-center text-white font-bold text-xs">P</div>
            <span className="font-bold text-base tracking-tight">ProducePilot</span>
          </div>
          
          <div className="text-landing-text-secondary font-medium">
            AI-powered fresh produce operations.
          </div>
          
          <div className="flex gap-6 font-medium text-landing-text-secondary">
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-landing-text-primary">How It Works</button>
            <button onClick={() => scrollToSection('agents')} className="hover:text-landing-text-primary">AI Agents</button>
            <Link to="/app" className="hover:text-landing-text-primary">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
