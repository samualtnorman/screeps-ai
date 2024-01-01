# Reading Material
- [Game Docs](https://docs.screeps.com/)
- [API Docs](https://docs.screeps.com/api/)
- [bonzAI Framework Overview](https://github.com/bonzaiferroni/bonzAI/wiki/Framework-Overview)
- [Overmind Framework Overview](https://github.com/bencbartlett/Overmind/wiki/Framework-overview)
- [Ben Bartlett's Overmind Blog](https://bencbartlett.com/projects/overmind/)
- [TooAngel Bot Design](https://github.com/TooAngel/screeps/blob/master/doc/Design.md)

# Other Bots
- [The International](https://github.com/The-International-Screeps-Bot/The-International-Open-Source) - actively
  maintained
- [Hivemind](https://github.com/Mirroar/hivemind) - actively maintained
- [TooAngel](https://github.com/TooAngel/screeps/) - actively maintained
- [Quorum](https://github.com/ScreepsQuorum/screeps-quorum/) - last updated in 2020
- [Overmind](https://github.com/bencbartlett/overmind) last updated in 2019
- [bonzAI](https://github.com/bonzaiferroni/bonzAI) - last updated in 2017

# Todo
- [x] send emails instead of just logging caught errors
- [x] create paths to exits
- [ ] os
- [ ] create path to mineral
- [ ] build walls and ramparts around exits
- [x] make creeps explore rooms not in `RoomsMemory` when they have nothing else to do
- [x] make creeps harvest from explored rooms if closer ones are blocked off
- [x] delete dead creep memory
- [ ] find hottest lines

# Symtoms of Naive Design
- Runtime errors when contents of `Memory` no longer compatible with updated script.
- Creeps (and other stuff) being abandoned when script is reset.

# Unorganised Notes
- if designed naively, will break when:
  - script restarted
  - `Memory` cleared or no longer compatible
- this means ideally the system needs to be as internally stateless as possible
  - this means deriving behaviour from the game's state rather than internal state when possible
- the goal is to get energy to the spawn or controller
  - if a creep has no energy, it's a no brainer to decide to collect energy
  - if a creep is full on energy, it's a no brainer to decide to deposit what is has
  - if a creep has energy it somehow needs to decide whether it's better to deposit what is has, or keep collecting
  - an easy way to avoid this decision for now is to:
    - collect if empty
    - deposit if full
    - collect if next to source
    - deposit if next to spawn
- If I go the OS route, I can drastically reduce the damage caused by a script reset by utilising a library called
  [seroval](https://www.npmjs.com/package/seroval)
  - I can make sure that processes store their state in an object associated with the process
  - I can then serialise all the processes and their state using **seroval**
  - This means that processes can just be recreated and carry on from where they left off like nothing happened
  - An issue with this though is that normally a reset is caused by me the programmer uploading new code.
    And new code means likely breaking changes making whatever is stored in `Memory` incompatible.
    - One "fix" for this is to only recreate processes that still have compatible memory or something.
      - But this can put the bot into very weird states
    - And another is to use or self roll a backwards compatible schema like protobuf to minimise breakage
      - This is all starting to sound very overkill now though
  - After going though the options, rather than going down this route I'm starting to think that the long term simpler
    solution is to at start up go though the state of the game and create new processes for stuff that need them e.g.
    creeps
- a source in a reserved room generates 3000 energy every 300 ticks
  - this means creeps working the source collectively need 5 `WORK`s
    - it is better to concentrate the `WORK`s on as few creeps as possible to minimise CPU usage
- efficient source harvesting:
  - every source should have 5 `WORK`s on it
    - these `WORK`s should be concentrated on as few creeps as possible
  - creeps that move harvested energy from around source to where it needs to be e.g. spawn or controller
- tasks:
  - the top task could be getting the RCL as high as possible
    - a dependency of this task is transfering energy to the controller
      - a dependency of this is a creep that has energy
        - which depends on having a creep
          - which itself depends on the spawn having energy
            - ...
        - having that creep collect energy
- in game bot has limited visibility, but client (web api) has full visibility
  - I can set up an external server that fulfills intel requests for the bot utilising the web api
    - I'm thinking of using `/api/user/console` for communication
      - this lets the external server read and write to `Memory`
