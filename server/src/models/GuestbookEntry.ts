import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';
import Event from './Event';

class GuestbookEntry extends Model {
    public id!: number;
    public name!: string; // Guest name (unauthenticated or user name)
    public message!: string;
    public eventId!: string;

    public readonly createdAt!: Date;
}

GuestbookEntry.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Event,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'guestbook_entries',
    }
);

Event.hasMany(GuestbookEntry, { foreignKey: 'eventId', as: 'guestbookEntries' });
GuestbookEntry.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

export default GuestbookEntry;
