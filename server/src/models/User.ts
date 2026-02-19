import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class User extends Model {
    public id!: number;
    public email!: string;
    public password!: string;
    public name!: string;
    public bio?: string;
    public profilePicture?: string;
    public role!: 'host' | 'guest';

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        profilePicture: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM('host', 'guest'),
            defaultValue: 'guest',
        },
    },
    {
        sequelize,
        tableName: 'users',
    }
);

export default User;
