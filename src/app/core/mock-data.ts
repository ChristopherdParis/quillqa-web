import { BusinessSettings, Product, Sale } from './models';

export const mockProducts: Product[] = [
  { id: '1', name: 'Tornillos 1/2" x 25mm', code: 'TORN-001', category: 'Tornillos', costPrice: 0.05, salePrice: 0.15, stock: 2, minStock: 50, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-03-10') },
  { id: '2', name: 'Martillo de Goma', code: 'MART-001', category: 'Herramientas', costPrice: 3.5, salePrice: 7.99, stock: 15, minStock: 5, createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-03-10') },
  { id: '3', name: 'Cinta Aislante 20m', code: 'CINT-001', category: 'Accesorios', costPrice: 0.45, salePrice: 1.25, stock: 45, minStock: 20, createdAt: new Date('2024-01-25'), updatedAt: new Date('2024-03-10') },
  { id: '4', name: 'Foco LED 9W', code: 'FOCO-001', category: 'Iluminacion', costPrice: 1.2, salePrice: 3.5, stock: 0, minStock: 30, createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-03-10') },
  { id: '5', name: 'Botella de Agua 500ml', code: 'AGUA-001', category: 'Bebidas', costPrice: 0.25, salePrice: 0.8, stock: 120, minStock: 50, createdAt: new Date('2024-02-05'), updatedAt: new Date('2024-03-10') },
  { id: '6', name: 'Galletas Integrales 300g', code: 'GALL-001', category: 'Alimentos', costPrice: 0.75, salePrice: 1.99, stock: 68, minStock: 30, createdAt: new Date('2024-02-10'), updatedAt: new Date('2024-03-10') },
  { id: '7', name: 'Pilas AAA x4', code: 'PILA-001', category: 'Electronica', costPrice: 1.5, salePrice: 4.5, stock: 8, minStock: 20, createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-03-10') },
  { id: '8', name: 'Cable USB tipo C', code: 'CABL-001', category: 'Accesorios', costPrice: 0.8, salePrice: 2.99, stock: 35, minStock: 15, createdAt: new Date('2024-02-20'), updatedAt: new Date('2024-03-10') },
];

export const mockSales: Sale[] = [
  { id: 'V001', items: [{ productId: '3', productName: 'Cinta Aislante 20m', quantity: 3, unitPrice: 1.25, subtotal: 3.75 }, { productId: '5', productName: 'Botella de Agua 500ml', quantity: 10, unitPrice: 0.8, subtotal: 8 }], total: 11.75, estimatedProfit: 8.75, timestamp: new Date('2024-03-10T08:15:00'), canceled: false },
  { id: 'V002', items: [{ productId: '2', productName: 'Martillo de Goma', quantity: 1, unitPrice: 7.99, subtotal: 7.99 }, { productId: '1', productName: 'Tornillos 1/2" x 25mm', quantity: 2, unitPrice: 0.15, subtotal: 0.3 }], total: 8.29, estimatedProfit: 3.79, timestamp: new Date('2024-03-10T10:45:00'), canceled: false },
  { id: 'V003', items: [{ productId: '6', productName: 'Galletas Integrales 300g', quantity: 5, unitPrice: 1.99, subtotal: 9.95 }], total: 9.95, estimatedProfit: 6.2, timestamp: new Date('2024-03-10T14:30:00'), canceled: false },
  { id: 'V004', items: [{ productId: '8', productName: 'Cable USB tipo C', quantity: 2, unitPrice: 2.99, subtotal: 5.98 }, { productId: '5', productName: 'Botella de Agua 500ml', quantity: 5, unitPrice: 0.8, subtotal: 4 }], total: 9.98, estimatedProfit: 6.78, timestamp: new Date('2024-03-10T16:20:00'), canceled: false },
];

export const mockBusinessSettings: BusinessSettings = {
  name: 'Mi Tienda',
  phone: '+34 612 345 678',
  currency: 'EUR',
  userId: 'user-001',
};
