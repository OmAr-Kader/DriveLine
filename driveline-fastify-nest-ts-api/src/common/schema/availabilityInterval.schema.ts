import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsOptional, IsInt, Min, Max, IsDefined } from 'class-validator';

@Schema({
  timestamps: false,
  versionKey: false,
  id: false,
  _id: false,
  toObject: {
    getters: false,
    versionKey: false,
    //virtuals: true,
    aliases: false,
    schemaFieldsOnly: true,
  },
  toJSON: { getters: false },
})
export class AvailabilityInterval {
  @Prop({ default: null })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  startUTC?: number;

  @Prop({ default: null })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  endUTC?: number;

  @Prop({ required: true })
  @IsBoolean()
  @IsDefined()
  dayOff: boolean;
}

export const AvailabilityIntervalSchema = SchemaFactory.createForClass(AvailabilityInterval);
