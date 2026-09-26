// src/contract-projects/multer.config.ts (یا مسیر متناظر در پروژه شما)
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

export const getMulterOptions = (folderName: string) => {
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = `./uploads/contracts/${folderName}`;
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    limits: {
      fileSize: 25 * 1024 * 1024, // حداکثر ۲۵ مگابایت برای مقالات و پتنت‌ها
    },
    fileFilter: (req: any, file: any, cb: any) => {
      // فرمت‌های مجاز برای مقالات علمی و اسناد
      const allowedExtensions = ['.xlsx','.xls','.pdf', '.doc', '.docx', '.zip', '.rar'];
      const fileExt = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        return cb(
          new BadRequestException(
            'فرمت فایل مجاز نیست. فقط فایل‌های pdf, doc, docx, zip, rar مجاز هستند.',
          ),
          false,
        );
      }
      cb(null, true);
    },
  };
};
