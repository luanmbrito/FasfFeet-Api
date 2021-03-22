import * as Yup from 'yup';
import { parseISO, format } from 'date-fns';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';
import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
// import Deliveryman from '../models/Deliveryman';

class DeliveryProblemController {
  async index(req, res) {
    const deliveryProblem = await DeliveryProblem.findAll({
      attributes: ['description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product'],
        },
      ],
    });

    if (!deliveryProblem) {
      return res.status(400).json({ error: 'Delivery problem not exist' });
    }

    return res.json({ deliveryProblem });
  }

  async show(req, res) {
    const deliveryProblem = await DeliveryProblem.findAll({
      where: { delivery_id: req.params.id },
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product'],
        },
      ],
    });

    if (!deliveryProblem) {
      return res.status(400).json({ error: 'Delivery problem not exist' });
    }

    return res.json({ deliveryProblem });
  }

  async store(req, res) {
    const delivery = await Delivery.findByPk(req.params.id);

    if (!delivery) {
      return res.json({ error: 'Delivery does not exist' });
    }

    if (delivery.end_date) {
      return res.json({ error: 'Delivery already completed' });
    }

    if (delivery.canceled_at) {
      return res.json({ error: 'Delivery already canceled' });
    }

    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const deliveryProblem = await DeliveryProblem.create({
      description: req.body.description,
      delivery_id: req.params.id,
    });

    return res.json({ deliveryProblem });
  }

  async delete(req, res) {
    const deliveryProblem = await DeliveryProblem.findByPk(req.params.id);

    if (!deliveryProblem) {
      return res.status(400).json({ error: 'Delivery problem not exist' });
    }

    const delivery = await Delivery.findOne({
      where: {
        id: deliveryProblem.delivery_id,
      },
      attributes: ['id', 'product', 'end_date'],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!delivery) {
      return res.json({ error: 'Delivery does not exist' });
    }

    if (delivery.end_date) {
      return res.json({ error: 'Delivery already completed' });
    }

    if (delivery.canceled_at) {
      return res.json({ error: 'Delivery already canceled' });
    }

    delivery.canceled_at = parseISO(
      format(Number(new Date().getTime()), "yyyy-MM-dd'T'HH:mm:ss")
    );
    await delivery.save();

    await Queue.add(CancellationMail.key, {
      deliveryProblem,
      delivery,
    });

    return res.json({ delivery });
  }
}

export default new DeliveryProblemController();
