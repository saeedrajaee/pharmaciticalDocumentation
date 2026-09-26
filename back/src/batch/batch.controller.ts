import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname, join } from 'path';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

// ================= STORAGE =================

const storage = diskStorage({
  destination: (req: any, file, cb) => {
    const user = req.user as TokenPayload;
    const userId = user?.sub;

    const uploadPath = join('./uploads/batch', String(userId ?? 'default'));

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req: any, file, cb) => {
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    cb(null, `${timestamp}-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  private getFilePaths(files: any) {
    const filePaths: Record<string, string> = {};
    if (!files) return filePaths;

    Object.keys(files).forEach((key) => {
      if (files[key]?.length > 0) {
        filePaths[key] = files[key][0].path;
      }
    });

    return filePaths;
  }

  // ===============================
  // CREATE
  // ===============================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'uploadDoc', maxCount: 1 }], {
      storage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateBatchDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles() files: any,
  ) {
    const filePaths = this.getFilePaths(files);
    return this.batchService.create(dto, filePaths, user);
  }

  // ===============================
  // FIND ALL
  // ===============================

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.batchService.findAll(user);
  }

  // ===============================
  // FIND ONE
  // ===============================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.batchService.findOne(id, user);
  }

  // ===============================
  // UPDATE
  // ===============================

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'uploadDoc', maxCount: 1 }], {
      storage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBatchDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles() files: any,
  ) {
    const filePaths = this.getFilePaths(files);
    return this.batchService.update(id, dto, filePaths, user);
  }

  // ===============================
  // DELETE
  // ===============================

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.batchService.remove(id, user);
  }
}
