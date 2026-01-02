import { Module, Global } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { DriversModule } from '../drivers/drivers.module';

@Global()
@Module({
    imports: [DriversModule],
    providers: [AppGateway],
    exports: [AppGateway],
})
export class GatewayModule { }
