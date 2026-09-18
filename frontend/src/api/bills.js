import client from './client';
export const getBills = () => client.get('/bills');
export const getPatientBills = (pId) => client.get(`/patients/${pId}/bills`);
export const createBill = (pId, data) => client.post(`/patients/${pId}/bills`, data);
export const updateBill = (pId, bId, data) => client.put(`/patients/${pId}/bills/${bId}`, data);
export const deleteBill = (pId, bId) => client.delete(`/patients/${pId}/bills/${bId}`);
