import client from './client';
export const getRooms = () => client.get('/rooms');
export const getRoom = (id) => client.get(`/rooms/${id}`);
export const createRoom = (data) => client.post('/rooms', data);
export const updateRoom = (id, data) => client.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => client.delete(`/rooms/${id}`);
