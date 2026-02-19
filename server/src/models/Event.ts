import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';
import User from './User';

class Event extends Model {
    public id!: string; // UUID
    public title!: string;
    public description?: string;
    public eventDate!: Date;
    public guestOfHonor!: string;
    public duration!: number; // in minutes
    public isPrivate!: boolean;
    public theme!: string; // JSON string or specific theme name
    public bannerUrl?: string;
    public hostId!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Event.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        eventDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        guestOfHonor: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER,
            defaultValue: 60,
        },
        isPrivate: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        theme: {
            type: DataTypes.STRING, // Could be 'default', 'modern', 'classic' etc.
            defaultValue: 'default',
        },
        bannerUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        hostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'events',
    }
);

// Define associations
User.hasMany(Event, { foreignKey: 'hostId', as: 'hostedEvents' });
Event.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

export default Event;
