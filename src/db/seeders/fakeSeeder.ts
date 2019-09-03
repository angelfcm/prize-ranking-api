import UserFactory from "../../test/factories/UserFactory";

export default async () => {
    if (process.env.debug === "0") {
        return;
    }
    const users = [];
    let promises = [];
    for (let i = 0; i < 300; i += 1) {
        promises.push(
            UserFactory().then(r => {
                users.push(r);
            }),
        );
    }
    await Promise.all(promises);
    promises = [];
};
