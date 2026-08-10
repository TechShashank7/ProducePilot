import mongoose from 'mongoose';

export function generateWarehouses() {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'NCR Central Hub',
      city: 'Noida',
      state: 'Uttar Pradesh',
      latitude: 28.5355,
      longitude: 77.3910,
      capacityKg: 50000
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Mumbai Coastal Storage',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0760,
      longitude: 72.8777,
      capacityKg: 40000
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Bangalore Tech Park DC',
      city: 'Bangalore',
      state: 'Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      capacityKg: 45000
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Pune Agro Facility',
      city: 'Pune',
      state: 'Maharashtra',
      latitude: 18.5204,
      longitude: 73.8567,
      capacityKg: 30000
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Nashik Vineyards Depot',
      city: 'Nashik',
      state: 'Maharashtra',
      latitude: 20.0110,
      longitude: 73.7903,
      capacityKg: 35000
    }
  ];
}
