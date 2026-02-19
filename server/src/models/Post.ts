import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';
import User from './User';
import Event from './Event';

class Post extends Model {
    public id!: number;
    public type!: 'text' | 'photo' | 'video';
    public content!: string; // Text content or File URL
    public caption?: string;
    public eventId!: string;
    public userId!: number; // Author

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Post.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM('text', 'photo', 'video'),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        caption: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Event,
                key: 'id',
            },
        },
        userId: {
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
        tableName: 'posts',
    }
);

Event.hasMany(Post, { foreignKey: 'eventId', as: 'posts' });
Post.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

export default Post;
