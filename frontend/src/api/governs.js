import client from './client';
export const getGoverns = () => client.get('/governs');
export const createGovern = (data) => client.post('/governs', data);
export const deleteGovern = (emp_id, r_id, shift) => client.delete(`/governs?emp_id=${emp_id}&r_id=${r_id}&shift=${shift}`);
