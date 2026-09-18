import client from './client';
export const getNurses = () => client.get('/nurses');
export const getNurse = (id) => client.get(`/nurses/${id}`);
export const createNurse = (data) => client.post('/nurses', data);
export const updateNurse = (id, data) => client.put(`/nurses/${id}`, data);
export const deleteNurse = (id) => client.delete(`/nurses/${id}`);
