import * as Yup from 'yup';
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
  // startOfHour,
  isBefore,
  parseISO,
} from 'date-fns';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Queue from '../../lib/Queue';
import NotificationMail from '../jobs/NotificationMail';

class DeliveryAdminController {
  async index(req, res) {
    const delivery = await Delivery.findAll({
      where: { canceled_at: null },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'product', 'start_date', 'end_date'],
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json({ delivery });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, recipient_id, deliveryman_id, product } = await Delivery.create(
      req.body
    );

    const delivery = await Delivery.findByPk(id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
      ],
    });

    await Queue.add(NotificationMail.key, {
      delivery,
    });

    return res.json({ id, recipient_id, deliveryman_id, product });
  }

  async update(req, res) {
    const { signature_id } = req.body;
    const { id, deliverymanId } = req.params;

    const delivery = await Delivery.findOne({
      where: { id, deliveryman_id: deliverymanId },
    });

    if (!delivery) {
      return res.status(400).json({ error: 'Invalid delivery' });
    }

    const deliverymanExist = await Deliveryman.findByPk(
      req.params.deliverymanId
    );

    if (!deliverymanExist) {
      return res.status(400).json({ error: 'Deliverman not exist' });
    }

    if ((delivery.start_date && delivery.end_date) || delivery.canceled_at) {
      return res.status(400).json({ error: 'Invalid delivery' });
    }

    const { date } = req.query;
    const searchDate = parseISO(format(Number(date), "yyyy-MM-dd'T'HH:mm:ss"));

    const startDay = parseISO(
      format(
        setSeconds(setMinutes(setHours(new Date(), 8), 0), 0),
        "yyyy-MM-dd'T'HH:mm:ss"
      )
    );

    const endDay = parseISO(
      format(
        setSeconds(setMinutes(setHours(new Date(), 18), 0), 0),
        "yyyy-MM-dd'T'HH:mm:ss"
      )
    );

    if (!delivery.start_date) {
      if (isBefore(searchDate, startDay) || isBefore(endDay, searchDate)) {
        return res.status(400).json({ error: 'Date Invalid' });
      }
      delivery.start_date = searchDate;
      await delivery.save();
    } else {
      if (isBefore(searchDate, delivery.start_date)) {
        return res.status(400).json({ error: 'Date Invalid' });
      }
      delivery.end_date = searchDate;
      delivery.signature_id = signature_id;
      await delivery.save();
    }

    return res.json({ delivery });
  }

  async delete(req, res) {
    const delivery = await Delivery.findByPk(req.params.id);

    if (!delivery) {
      return res.status(400).json({ error: 'delivery does not exist' });
    }

    if (delivery.start_date) {
      return res
        .status(200)
        .json({ error: 'Package do not cancel with pickup started' });
    }

    delivery.canceled_at = new Date();
    delivery.save();

    return res.json({ delivery });
  }
}

export default new DeliveryAdminController();
