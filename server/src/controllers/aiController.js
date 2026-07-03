import { asyncHandler } from '../utils/api.js';
import * as aiService from '../services/ai.service.js';

export const suggestItinerary = asyncHandler(async (req, res) => {
  const { destination, days, budget, style, group } = req.body;
  
  if (!destination || !days || !budget) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ điểm đến, số ngày và ngân sách.' });
  }

  const result = await aiService.generateItinerary({
    destination,
    days: Number(days),
    budget,
    style: style || 'Tự do',
    group: Number(group) || 1
  });

  res.json({ itinerary: result });
});

export const suggestPlaces = asyncHandler(async (req, res) => {
  const { destination, category } = req.body;
  
  if (!destination) {
    return res.status(400).json({ message: 'Vui lòng cung cấp điểm đến.' });
  }

  const result = await aiService.suggestPlaces(destination, category || 'tổng hợp');
  res.json({ places: result });
});
