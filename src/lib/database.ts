import Database from 'better-sqlite3';

const DB_PATH = process.env.DATABASE_URL || './qgov.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      epoch INTEGER NOT NULL,
      title TEXT,
      url TEXT,
      status INTEGER,
      total_votes INTEGER DEFAULT 0,
      yes_votes INTEGER DEFAULT 0,
      no_votes INTEGER DEFAULT 0,
      proposer_identity TEXT,
      contract_name TEXT,
      contract_index INTEGER,
      proposal_index INTEGER,
      number_of_options INTEGER,
      proposal_type TEXT,
      published TEXT,
      published_tick INTEGER,
      latest_vote_tick INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_proposals_epoch ON proposals(epoch);
    CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

    CREATE TABLE IF NOT EXISTS ballots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id TEXT NOT NULL,
      computor_id TEXT NOT NULL,
      vote INTEGER NOT NULL,
      vote_tick INTEGER NOT NULL,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id)
    );

    CREATE INDEX IF NOT EXISTS idx_ballots_proposal ON ballots(proposal_id);
    CREATE INDEX IF NOT EXISTS idx_ballots_computor ON ballots(computor_id);

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id TEXT NOT NULL,
      lang_code TEXT NOT NULL,
      text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(proposal_id, lang_code)
    );

    CREATE INDEX IF NOT EXISTS idx_translations_proposal ON translations(proposal_id);

    CREATE TABLE IF NOT EXISTS computors (
      epoch INTEGER NOT NULL,
      computor_id TEXT NOT NULL,
      index_position INTEGER NOT NULL,
      PRIMARY KEY (epoch, computor_id)
    );

    CREATE INDEX IF NOT EXISTS idx_computors_epoch ON computors(epoch);
  `);
}

export interface ProposalRow {
  id: string;
  epoch: number;
  title: string | null;
  url: string | null;
  status: number | null;
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  proposer_identity: string | null;
  contract_name: string | null;
  contract_index: number | null;
  proposal_index: number | null;
  number_of_options: number | null;
  proposal_type: string | null;
  published: string | null;
  published_tick: number | null;
  latest_vote_tick: number | null;
}

export interface BallotRow {
  id: number;
  proposal_id: string;
  computor_id: string;
  vote: number;
  vote_tick: number;
}

export interface TranslationRow {
  id: number;
  proposal_id: string;
  lang_code: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export function saveProposals(proposals: any[]): number {
  const database = getDb();
  const insertProposal = database.prepare(`
    INSERT OR REPLACE INTO proposals (
      id, epoch, title, url, status, total_votes, yes_votes, no_votes,
      proposer_identity, contract_name, contract_index, proposal_index,
      number_of_options, proposal_type, published, published_tick, latest_vote_tick, updated_at
    ) VALUES (
      @id, @epoch, @title, @url, @status, @totalVotes, @yesVotes, @noVotes,
      @proposerIdentity, @contractName, @contractIndex, @proposalIndex,
      @numberOfOptions, @proposalType, @published, @publishedTick, @latestVoteTick, CURRENT_TIMESTAMP
    )
  `);

  const insertBallot = database.prepare(`
    INSERT INTO ballots (proposal_id, computor_id, vote, vote_tick)
    VALUES (@proposalId, @computorId, @vote, @voteTick)
  `);

  const deleteBallots = database.prepare(`DELETE FROM ballots WHERE proposal_id = ?`);

  let savedCount = 0;

  const transaction = database.transaction(() => {
    for (const p of proposals) {
      const proposalId = p.proposalId || p.id;

      insertProposal.run({
        id: proposalId,
        epoch: p.epoch,
        title: p.title || null,
        url: p.url || null,
        status: p.status,
        totalVotes: p.totalVotes || p.sumOption0 + p.sumOption1 || 0,
        yesVotes: p.sumOption1 || p.yesVotes || 0,
        noVotes: p.sumOption0 || p.noVotes || 0,
        proposerIdentity: p.proposerIdentity || null,
        contractName: p.contractName || null,
        contractIndex: p.contractIndex || null,
        proposalIndex: p.proposalIndex || null,
        numberOfOptions: p.numberOfOptions || null,
        proposalType: p.proposalType || null,
        published: p.published || null,
        publishedTick: p.publishedTick || null,
        latestVoteTick: p.latestVoteTick || null
      });

      if (p.ballots && p.ballots.length > 0) {
        deleteBallots.run(proposalId);

        for (const ballot of p.ballots) {
          insertBallot.run({
            proposalId,
            computorId: ballot.computorId,
            vote: ballot.vote,
            voteTick: ballot.voteTick
          });
        }
      }

      savedCount++;
    }
  });

  transaction();
  return savedCount;
}

export function getProposalsByEpoch(epoch: number): ProposalRow[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM proposals WHERE epoch = ? ORDER BY proposal_index ASC
  `).all(epoch) as ProposalRow[];
}

export function getProposalById(id: string): ProposalRow | undefined {
  const database = getDb();
  return database.prepare(`SELECT * FROM proposals WHERE id = ?`).get(id) as ProposalRow | undefined;
}

export function getAllEpochs(): number[] {
  const database = getDb();
  const rows = database.prepare(`SELECT DISTINCT epoch FROM proposals ORDER BY epoch DESC`).all() as { epoch: number }[];
  return rows.map(r => r.epoch);
}

export function getBallotsByProposalId(proposalId: string): BallotRow[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM ballots WHERE proposal_id = ?
  `).all(proposalId) as BallotRow[];
}

export function getTranslation(proposalId: string, langCode: string): TranslationRow | undefined {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM translations WHERE proposal_id = ? AND lang_code = ?
  `).get(proposalId, langCode) as TranslationRow | undefined;
}

export function setTranslation(proposalId: string, langCode: string, text: string): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO translations (proposal_id, lang_code, text, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(proposal_id, lang_code) DO UPDATE SET
      text = excluded.text,
      updated_at = CURRENT_TIMESTAMP
  `).run(proposalId, langCode, text);
}

export function getAllTranslations(proposalId: string): TranslationRow[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM translations WHERE proposal_id = ?
  `).all(proposalId) as TranslationRow[];
}

export function getLatestEpoch(): number {
  const database = getDb();
  const row = database.prepare(`SELECT MAX(epoch) as maxEpoch FROM proposals`).get() as { maxEpoch: number | null };
  return row?.maxEpoch || 0;
}

export interface SearchResult {
  epoch: number;
  id: string;
  title: string;
  url: string;
  status: number;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  proposerIdentity: string | null;
}

export function searchAllProposals(query: string, author: string = '', publisher: string = '', status?: number): SearchResult[] {
  const database = getDb();
  const results: SearchResult[] = [];
  
  const queryLower = query.toLowerCase();
  const authorLower = author.toLowerCase();
  const publisherLower = publisher.toLowerCase();

  const proposals = database.prepare(`
    SELECT * FROM proposals WHERE epoch >= 134 ORDER BY epoch DESC
  `).all() as ProposalRow[];

  for (const p of proposals) {
    const title = p.title || '';
    const url = p.url || '';
    
    let authorFromUrl = '';
    if (url.includes('github.com')) {
      const parts = url.replace('https://', '').replace('http://', '').split('/');
      if (parts.length >= 2) {
        authorFromUrl = parts[1];
      }
    }
    
    const proposerIdentity = p.proposer_identity || '';
    
    const matchesQuery = !queryLower || title.toLowerCase().includes(queryLower) || url.toLowerCase().includes(queryLower);
    const matchesAuthor = !authorLower || authorFromUrl.toLowerCase().includes(authorLower);
    const matchesPublisher = !publisherLower || proposerIdentity.toLowerCase().includes(publisherLower);
    
    if (matchesQuery && matchesAuthor && matchesPublisher) {
      if (status === undefined || p.status === status) {
        results.push({
          epoch: p.epoch,
          id: p.id,
          title: title || 'Untitled',
          url: url || '',
          status: p.status || 0,
          yesVotes: p.yes_votes,
          noVotes: p.no_votes,
          totalVotes: p.total_votes,
          proposerIdentity: proposerIdentity
        });
      }
    }
  }
  
  return results;
}

export interface ComputorRow {
  epoch: number;
  computor_id: string;
  index_position: number;
}

export function saveComputors(epoch: number, computors: string[]): number {
  const database = getDb();
  
  const insertComputor = database.prepare(`
    INSERT OR REPLACE INTO computors (epoch, computor_id, index_position)
    VALUES (?, ?, ?)
  `);

  const deleteEpoch = database.prepare(`DELETE FROM computors WHERE epoch = ?`);

  let savedCount = 0;

  const transaction = database.transaction(() => {
    deleteEpoch.run(epoch);
    
    for (let i = 0; i < computors.length; i++) {
      insertComputor.run(epoch, computors[i], i);
      savedCount++;
    }
  });

  transaction();
  return savedCount;
}

export function getComputorsByEpoch(epoch: number): ComputorRow[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM computors WHERE epoch = ? ORDER BY index_position ASC
  `).all(epoch) as ComputorRow[];
}

export function getLatestComputorEpoch(): number {
  const database = getDb();
  const row = database.prepare(`SELECT MAX(epoch) as maxEpoch FROM computors`).get() as { maxEpoch: number | null };
  return row?.maxEpoch || 0;
}
