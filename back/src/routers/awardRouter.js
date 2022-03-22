import is from '@sindresorhus/is';
import { Router } from 'express';
import { login_required } from '../middlewares/login_required';
import { updateMiddleware } from '../middlewares/updateMiddleware';
import { AwardService } from '../services/AwardService';

const awardRouter = Router();

awardRouter.post('/award/create', login_required, async (req, res, next) => {
    try {
        if (is.emptyObject(req.body)) {
            throw new Error(
                'headers의 Content-Type을 application/json으로 설정해주세요'
            );
        }
        // login_required에서 currentUserId에 로그인 유저의 id를 넣어둠
        const user_id = req.currentUserId;
        const { title, description } = req.body;
        console.log(user_id, title, description);

        const newAward = await AwardService.addAward({
            user_id,
            title,
            description
        });

        res.status(201).json(newAward);
    } catch (error) {
        next(error);
    }
});

awardRouter.get(
    '/awardlist/:user_id',
    login_required,
    async function (req, res, next) {
        try {
            // 전체 수상 목록을 얻음
            const user_id = req.params.user_id;
            const awards = await AwardService.getAwards({ user_id });
            res.status(200).send(awards);
        } catch (error) {
            next(error);
        }
    }
);

awardRouter.get('/awards/:id', login_required, async (req, res, next) => {
    try {
        const award_id = req.params.id;
        const currentAwardInfo = await AwardService.getAwardInfo({
            award_id
        });

        res.status(200).send(currentAwardInfo);
    } catch (error) {
        next(error);
    }
});

awardRouter.put(
    '/awards/:id',
    login_required,
    updateMiddleware,
    async function (req, res, next) {
        try {
            // URI로부터 수상 요소 id를 추출함.
            const award_id = req.params.id;
            const user_id = req.currentUserId;
            const toUpdate = req.toUpdate;
            console.log('toUpdate : ', toUpdate);
            // 해당 수상 요소 아이디로 수상 요소 정보를 db에서 찾아 업데이트함. 업데이트 요소가 없을 시 생략함
            const updatedAward = await AwardService.setAward({
                award_id,
                user_id,
                toUpdate
            });

            res.status(200).json(updatedAward);
        } catch (error) {
            next(error);
        }
    }
);

awardRouter.delete(
    '/awards/:id',
    login_required,
    async function (req, res, next) {
        try {
            // URI로부터 수상 요소 id를 추출함.
            const award_id = req.params.id;
            const user_id = req.currentUserId;
            await AwardService.deleteAward({ award_id, user_id });
            console.log(award_id);
            res.status(200).send('삭제되었습니다.');
        } catch (error) {
            next(error);
        }
    }
);

export { awardRouter };
