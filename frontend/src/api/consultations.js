import client from './client';
export const getConsultations = () => client.get('/consultations');
export const createConsultation = (data) => client.post('/consultations', data);
export const updateConsultation = (data) => client.put('/consultations', data);
export const deleteConsultation = (emp_id, p_id, date, time) => 
  client.delete(`/consultations?emp_id=${emp_id}&p_id=${p_id}&date=${date}&time=${time}`);
