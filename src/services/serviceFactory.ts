import { Service } from './Service';
import UserService from './user/user.service';
import PaymentService from './payment/payment.service';
import GoogleAuthService from './googleAuthService';
import AppleAuthService from './appleAuthService';


type ServiceKey = 'UserService' | 'PaymentService' | 'GoogleAuthService' | 'AppleAuthService';

class ServiceFactory {
	private services: { [key: string]: Service } = {};

	create() {
		// Add new models here to the factory
		this.services['UserService'] = new UserService();
		this.services['PaymentService'] = new PaymentService();
		this.services['GoogleAuthService'] = GoogleAuthService.getInstance();
		this.services['AppleAuthService'] = AppleAuthService.getInstance();


		for (const key in this.services) {
			this.services[key].start();
		}
	}

	get<T extends Service>(name: ServiceKey): T {
		return this.services[name] as T;
	}
}

const serviceFactory = new ServiceFactory();
export default serviceFactory;

// TEMP
//window.sf = serviceFactory;
