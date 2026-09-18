import client from './client';
export const getEmployees = () => client.get('/employees');
export const getEmployee = (id) => client.get(`/employees/${id}`);
export const createEmployee = (data) => client.post('/employees', data);
export const updateEmployee = (id, data) => client.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => client.delete(`/employees/${id}`);
