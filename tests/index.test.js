const { removeItemOnce, updateRooms, app: server } = require("../src")

test("Removes one element from an array", () => {
    expect(removeItemOnce([1, 1, 2, 1], 1)).toStrictEqual([1, 2, 1]);
})

//todo: somehow fix the open handles issue
afterAll(async () => {
    if (server) {
        await server.close();
    }
});