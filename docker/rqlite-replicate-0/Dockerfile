FROM rqlite/rqlite:4.5.0

CMD ["rqlited", "-http-addr", "rqlite-replicate-0:4001", "-raft-addr", "rqlite-replicate-0:4002", "-join", "http://rqlite-master:4001", "/rqlite/file/data"]