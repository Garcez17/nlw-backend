import express from 'express';
import ClassesControler from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';

const routes = express.Router();
const ClassesControllers = new ClassesControler();
const ConnectionsControllers = new ConnectionsController();

routes.post("/classes", ClassesControllers.create);
routes.get("/classes", ClassesControllers.index);

routes.get("/connections", ConnectionsControllers.index);
routes.post("/connections", ConnectionsControllers.create);

export default routes;