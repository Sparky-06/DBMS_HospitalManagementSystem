import client from './client';
export const getDoctors = () => client.get('/doctors');
export const getDoctor = (id) => client.get(`/doctors/${id}`);
export const createDoctor = (data) => client.post('/doctors', data);
export const updateDoctor = (id, data) => client.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => client.delete(`/doctors/${id}`);
