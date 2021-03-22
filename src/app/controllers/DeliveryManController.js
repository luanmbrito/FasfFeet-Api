import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliveryManController {
  async index(req, res) {
    const deliveryman = await Deliveryman.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path'],
        },
      ],
    });

    return res.json(deliveryman);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validations fail' });
    }

    const delivermanExist = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (delivermanExist) {
      return res.status(400).json({ error: 'User already exist' });
    }

    const { id, name, email } = await Deliveryman.create(req.body);

    return res.json({ id, name, email });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validations Fail' });
    }

    const { email } = req.body;
    const deliveryman = await Deliveryman.findByPk(req.params.id);

    if (email !== deliveryman.email) {
      const deliverymanExist = await Deliveryman.findOne({ where: { email } });

      if (deliverymanExist) {
        return res.status(400).json({ error: 'User already exist' });
      }
    }

    const { id, name } = await deliveryman.update(req.body);

    return res.json({ id, name, email });
  }

  async delete(req, res) {
    const deliverymanExist = await Deliveryman.findByPk(req.params.id);

    if (!deliverymanExist) {
      return res.status(400).json({ error: 'User not exist' });
    }

    const deliverymanDelete = await Deliveryman.destroy({
      where: { id: req.params.id },
    });

    return res.json({ msg: 'User as been deleted', deliverymanDelete });
  }
}

export default new DeliveryManController();
