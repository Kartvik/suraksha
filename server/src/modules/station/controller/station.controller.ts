import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middelware.js';
import { StationService } from '../service/station.service.js';

const stationService = new StationService();

export const createStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await stationService.createStation(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createStationAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await stationService.createStationAdmin(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllStations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stations = await stationService.getAllStations();
    res.status(200).json({ success: true, stations });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const station = await stationService.getStationById(req.params.id as string);
    res.status(200).json({ success: true, station });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await stationService.updateStation(req.params.id as string, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleStationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await stationService.toggleStationStatus(req.params.id as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeStationAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await stationService.removeStationAdmin(req.params.id as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};