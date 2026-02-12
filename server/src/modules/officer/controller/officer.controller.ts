import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middelware.js';
import { OfficerService } from '../service/officer.service.js';

const officerService = new OfficerService();

export const createOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Station admin can only create for their own station
    const stationId = req.user?.stationId;
    if (!stationId) {
      res.status(403).json({ success: false, message: 'No station linked to your account' });
      return;
    }
    const result = await officerService.createOfficer({ ...req.body, stationId });
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyOfficerOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { officerId, otp } = req.body;
    const result = await officerService.verifyOfficerOTP(officerId, otp);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resendOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await officerService.resendOTP(req.params.id as string );
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOfficersByStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stationId = req.params.stationId || req.user?.stationId;
    const officers = await officerService.getOfficersByStation(stationId! as string);
    res.status(200).json({ success: true, officers });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOfficerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const officer = await officerService.getOfficerById(req.params.id as string);
    res.status(200).json({ success: true, officer });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await officerService.updateOfficer(req.params.id as string, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleDutyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await officerService.toggleDutyStatus(req.params.id as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const retireOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await officerService.retireOfficer(req.params.id as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await officerService.deleteOfficer(req.params.id as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const transferOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await officerService.transferOfficer(req.params.id as string, req.body.newStationId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};