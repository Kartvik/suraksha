import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service.js';

const authService = new AuthService();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.verifyEmail(req.params.token as string);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};