import statistics from '../services/statisticsService.js';
export async function getInsights(req,res){res.json({success:true,data:await statistics(req.user.id)})}
