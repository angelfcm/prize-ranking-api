import { model, models, Schema } from "mongoose";
import { rankingModeCodes } from "../core/constants";
import Score from "./Score";

if (!models.User) {
    const scores = {};
    Object.values(rankingModeCodes).forEach(
        m => (scores[m] = { type: Score.schema, required: true, default: new Score() }),
    );
    const schema = new Schema(
        {
            credits: { type: Number, required: true, index: true, default: 0 },
            provider_user_id: { type: String, required: true, index: true, unique: true },
            scores,
        },
        { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
    );

    model("User", schema);
}

export default model("User");
