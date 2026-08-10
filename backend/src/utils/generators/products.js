import mongoose from 'mongoose';

export function generateProducts() {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Tomatoes',
      category: 'Fruit',
      typicalShelfLifeDays: { min: 7, max: 10 },
      idealStorageTempC: { min: 13, max: 15 },
      idealHumidityPct: { min: 90, max: 95 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Bananas',
      category: 'Fruit',
      typicalShelfLifeDays: { min: 5, max: 7 },
      idealStorageTempC: { min: 13, max: 15 },
      idealHumidityPct: { min: 90, max: 95 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Mangoes',
      category: 'Fruit',
      typicalShelfLifeDays: { min: 7, max: 14 },
      idealStorageTempC: { min: 10, max: 13 },
      idealHumidityPct: { min: 90, max: 95 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Spinach',
      category: 'Vegetable',
      typicalShelfLifeDays: { min: 3, max: 5 },
      idealStorageTempC: { min: 0, max: 4 },
      idealHumidityPct: { min: 95, max: 100 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Apples',
      category: 'Fruit',
      typicalShelfLifeDays: { min: 30, max: 90 },
      idealStorageTempC: { min: 0, max: 4 },
      idealHumidityPct: { min: 90, max: 95 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Grapes',
      category: 'Fruit',
      typicalShelfLifeDays: { min: 14, max: 30 },
      idealStorageTempC: { min: -1, max: 0 },
      idealHumidityPct: { min: 90, max: 95 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Onions',
      category: 'Vegetable',
      typicalShelfLifeDays: { min: 30, max: 180 },
      idealStorageTempC: { min: 0, max: 4 },
      idealHumidityPct: { min: 65, max: 70 },
      unit: 'kg'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Potatoes',
      category: 'Vegetable',
      typicalShelfLifeDays: { min: 30, max: 90 },
      idealStorageTempC: { min: 4, max: 10 },
      idealHumidityPct: { min: 90, max: 95 },
      unit: 'kg'
    }
  ];
}
