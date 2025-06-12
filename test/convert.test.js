const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {expect} = require('chai');

describe('convert.js', function() {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
  const publicDir = path.join(tmpDir, 'public');
  const txtFile = path.join(publicDir, 'bannedlist.txt');
  const jsonFile = path.join(publicDir, 'bannedlist.json');
  const convertSource = path.join(__dirname, '..', 'convert.js');
  const convertCopy = path.join(tmpDir, 'convert.js');

  before(function() {
    fs.mkdirSync(publicDir, {recursive: true});
    fs.writeFileSync(txtFile, 'foo\nbar');
    fs.copyFileSync(convertSource, convertCopy);
    execFileSync('node', [convertCopy], {cwd: tmpDir});
  });

  after(function() {
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  it('creates bannedlist.json with bannedWords array', function() {
    const content = fs.readFileSync(jsonFile, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed).to.be.an('object');
    expect(parsed).to.have.property('bannedWords');
    expect(parsed.bannedWords).to.be.an('array');
  });
});
