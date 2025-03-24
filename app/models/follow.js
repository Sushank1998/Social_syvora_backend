'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class follow extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations between follow and user models

      // A follow belongs to a follower (user who is following)
      follow.belongsTo(models.user, {
        foreignKey: 'follower_id', // The follower (user) who is following
        as: 'follower', // Alias for the follower user
      });

      // A follow belongs to a following (user who is being followed)
      follow.belongsTo(models.user, {
        foreignKey: 'following_id', // The user who is being followed
        as: 'following', // Alias for the following user
      });
    }
  }

  follow.init(
    {
      follow_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      following_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'user',
          key: 'user_id',
        },
        field: 'following_id',
      },
      follower_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'user',
          key: 'user_id',
        },
        field: 'follower_id',
      },
    },
    {
      sequelize,
      modelName: 'follow',
    }
  );

  return follow;
};
