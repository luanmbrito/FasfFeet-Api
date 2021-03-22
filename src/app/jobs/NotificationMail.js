import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class NotificationMail {
  get key() {
    return 'NotificationMail';
  }

  async handle({ data }) {
    const { delivery } = data;

    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}>`,
      subject: 'Cadastrado de nova encomenda',
      template: 'notification',
      context: {
        user: delivery.deliveryman.name,
        product: delivery.product,
      },
    });
  }
}

export default new NotificationMail();
