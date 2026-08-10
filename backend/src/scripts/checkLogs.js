import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AgentActivityLog from '../models/AgentActivityLog.js';

dotenv.config();

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const logs = await AgentActivityLog.find().sort({ createdAt: -1 }).limit(10);
    console.log("Last 10 logs types:");
    logs.forEach(l => console.log(l.agentType, l.createdAt));
    
    const count = await AgentActivityLog.aggregate([{ $group: { _id: '$agentType', count: { $sum: 1 } } }]);
    console.log("Total counts by type:", count);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLogs();
