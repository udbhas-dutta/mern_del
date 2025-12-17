import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  BUYER = 'Buyer',
  SELLER = 'Seller',
  ADMIN = 'Admin'
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.BUYER 
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);