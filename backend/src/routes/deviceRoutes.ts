import { Router } from 'express';
import { DeviceController } from '../controllers/deviceController';

const router = Router();
const deviceController = new DeviceController();

router.get('/', deviceController.getAllDevices);
router.get('/:id', deviceController.getDeviceById);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);
router.get('/test-db', deviceController.testDatabase);

export const deviceRoutes = router; 