import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middelware.js';
import { SOSService } from '../service/sos.service.js';
import { SOSStatus } from '../../../models/index.js';

const sosService = new SOSService();

export const triggerSOS = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude } = req.body;
    const result = await sosService.triggerSOS(
      req.user!.userId,
      latitude,
      longitude
    );
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptSOS = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await sosService.acceptSOS(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSOSStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await sosService.updateSOSStatus(
      req.params.id as string,
      req.body.status as SOSStatus
    );
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSOSHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await sosService.getSOSHistory(req.user!.userId);
    res.status(200).json({ success: true, history });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getActiveSOSForStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stationId = req.user?.stationId || req.params.stationId;
    const active = await sosService.getActiveSOSForStation(stationId! as string);
    res.status(200).json({ success: true, active });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};