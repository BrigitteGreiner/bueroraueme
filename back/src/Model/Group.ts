import { World } from "./World";
import { UserInterface } from "./UserInterface";
import {PositionInterface} from "_Model/PositionInterface";
import {uuid} from "uuidv4";

export class Group {
    static readonly MAX_PER_GROUP = 4;

    private id: string;
    private users: UserInterface[];
    private connectCallback: (user1: string, user2: string, group: Group) => void;
    private disconnectCallback: (user1: string, user2: string, group: Group) => void;


    constructor(users: UserInterface[],
                connectCallback: (user1: string, user2: string, group: Group) => void,
                disconnectCallback: (user1: string, user2: string, group: Group) => void
    ) {
        this.users = [];
        this.connectCallback = connectCallback;
        this.disconnectCallback = disconnectCallback;
        this.id = uuid();

        users.forEach((user: UserInterface) => {
            this.join(user);
        });
    }

    getUsers(): UserInterface[] {
        return this.users;
    }

    getId() : string{
        return this.id;
    }

    /**
     * Returns the barycenter of all users (i.e. the center of the group)
     */
    getPosition(): PositionInterface {
        let x = 0;
        let y = 0;
        // Let's compute the barycenter of all users.
        this.users.forEach((user: UserInterface) => {
            x += user.position.x;
            y += user.position.y;
        });
        x /= this.users.length;
        y /= this.users.length;
        return {
            x,
            y
        };
    }

    isFull(): boolean {
        return this.users.length >= Group.MAX_PER_GROUP;
    }

    isEmpty(): boolean {
        return this.users.length <= 1;
    }

    join(user: UserInterface): void
    {
        // Broadcast on the right event
        this.users.forEach((groupUser: UserInterface) => {
            this.connectCallback(user.id, groupUser.id, this);
        });
        this.users.push(user);
        user.group = this;
    }

    isPartOfGroup(user: UserInterface): boolean
    {
        return this.users.indexOf(user) !== -1;
    }

    isStillIn(user: UserInterface): boolean
    {
        if(!this.isPartOfGroup(user)) {
            return false;
        }
        let stillIn = true;
        for(let i = 0; i <= this.users.length; i++) {
            let userInGroup = this.users[i];
            let distance = World.computeDistance(user, userInGroup);
            if(distance > World.MIN_DISTANCE) {
                stillIn = false;
                break;
            }
        }
        return stillIn;
    }

    /*removeFromGroup(users: UserInterface[]): void
    {
        for(let i = 0; i < users.length; i++){
            let user = users[i];
            const index = this.users.indexOf(user, 0);
            if (index > -1) {
                this.users.splice(index, 1);
            }
        }
    }*/

    leave(user: UserInterface): void
    {
        const index = this.users.indexOf(user, 0);
        if (index === -1) {
            throw new Error("Could not find user in the group");
        }

        this.users.splice(index, 1);
        user.group = undefined;

        // Broadcast on the right event
        this.users.forEach((groupUser: UserInterface) => {
            this.disconnectCallback(user.id, groupUser.id, this);
        });
    }

    /**
     * Let's kick everybody out.
     * Usually used when there is only one user left.
     */
    destroy(): void
    {
        this.users.forEach((user: UserInterface) => {
            this.leave(user);
        })
    }
}
