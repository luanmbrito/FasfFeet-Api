import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import FileController from './app/controllers/FileController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import DeliveryManController from './app/controllers/DeliveryManController';
import DeliveryAdmin from './app/controllers/DeliveryAdminController';
import Delivery from './app/controllers/DeliveryController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.get('/deliveryman/:id/deliviries/:end_date?', Delivery.index);
routes.put('/deliveryman/:id/:deliverymanId/deliviries', Delivery.update);

routes.post('/delivery/:id/problems', DeliveryProblemController.store);
routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.post('/recipients', RecipientController.store);
routes.put('/recipients', RecipientController.update);
routes.post('/files', upload.single('file'), FileController.store);

routes.get('/deliverymans', DeliveryManController.index);
routes.post('/deliverymans', DeliveryManController.store);
routes.put('/deliverymans/:id', DeliveryManController.update);
routes.delete('/deliverymans/:id', DeliveryManController.delete);

routes.post('/delivery', DeliveryAdmin.store);
routes.get('/delivery', DeliveryAdmin.index);
routes.put('/delivery/:id/:deliverymanId/delivery', DeliveryAdmin.update);
routes.delete('/delivery/:id', DeliveryAdmin.delete);

routes.get('/delivery/problems', DeliveryProblemController.index);
routes.get('/delivery/:id/problems', DeliveryProblemController.show);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;
