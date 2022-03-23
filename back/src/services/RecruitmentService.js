import { Recruitment, User } from '../db'; // from을 폴더(db) 로 설정 시, 디폴트로 index.js 로부터 import함.
import { v4 as uuidv4 } from 'uuid';

class RecruitmentService {
    // 게시글 생성
    static async addRecruitment({ user_id, title, detail, language }) {
        const id = uuidv4();
        // title이나 detail 검증필요?
        const captain = await User.findById(user_id);
        console.log(language);
        const newRecruitment = { id, captain, title, detail, language };

        const createdNewRecruitment = await Recruitment.create(newRecruitment);

        return createdNewRecruitment;
    }

    // 게시물 1개보기
    static async getRecruitment({ recruitmentId }) {
        const recruitment = await Recruitment.findById({ recruitmentId });
        if (!recruitment) {
            const errorMessage = '삭제되었거나 등록되지 않은 게시물입니다.';
            throw new Error(errorMessage);
        }
        return recruitment;
    }

    // 게시물 수정하기
    static async setRecruitment({ recruitmentId, user_id, toUpdate }) {
        let recruitment = await Recruitment.findById({ recruitmentId });
        console.log('hi');

        if (!recruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        console.log(recruitment._doc);
        if (recruitment._doc.captain.id !== user_id) {
            const errorMessage = '수정할 수 없습니다.';
            throw new Error(errorMessage);
        }

        console.log(toUpdate);
        const keys = Object.keys(toUpdate);
        const values = Object.values(toUpdate);

        for (let i = 0; i < keys.length; i++) {
            recruitment = await Recruitment.update(
                recruitmentId,
                keys[i],
                values[i]
            );
            console.log(keys[i], values[i]);
        }

        return recruitment;
    }

    // 게시글 목록보기
    static async getRecruitments() {
        const recruitments = await Recruitment.findAll();
        return recruitments;
    }

    static async likeRecruitment({ recruitmentId, user_id }) {
        let likedRecruitment = await Recruitment.findById({ recruitmentId });

        if (!likedRecruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        const user = await User.findById(user_id);

        console.log(likedRecruitment.like.indexOf(user._id));
        if (likedRecruitment.like.includes(user._id)) {
            const errorMessage = '이미 좋아요를 누른 게시물입니다.';
            throw new Error(errorMessage);
        }

        const newLikeValue = { $push: { like: user } };

        likedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newLikeValue
        );

        return likedRecruitment;
    }

    static async unlikeRecruitment({ recruitmentId, user_id }) {
        let unlikedRecruitment = await Recruitment.findById({ recruitmentId });

        if (!unlikedRecruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        const user = await User.findById(user_id);

        console.log(unlikedRecruitment.like.indexOf(user._id));
        const unlikedIndex = unlikedRecruitment.like.indexOf(user._id);
        if (unlikedIndex === -1) {
            const errorMessage = '좋아요를 누르지 않은 게시물입니다.';
            throw new Error(errorMessage);
        }

        const like = unlikedRecruitment.like;
        like.splice(unlikedIndex, 1);
        const newUnlikeValue = { like };

        unlikedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newUnlikeValue
        );

        return unlikedRecruitment;
    }

    // 모집마감 토글
    static async closeRecruitment({ recruitmentId, userId }) {
        const recruitment = await Recruitment.findById({
            recruitmentId
        });
        let nowEnrolling = recruitment.nowEnrolling;
        if (!recruitment) {
            const errorMessage = '삭제되었거나 등록되지 않은 게시물입니다.';
            throw new Error(errorMessage);
        }

        if (userId !== recruitment.captain.id) {
            const errorMessage = '권한이 없습니다.';
            throw new Error(errorMessage);
        }

        const updatedRecruitment = await Recruitment.toggle({
            recruitmentId,
            nowEnrolling
        });
        nowEnrolling = updatedRecruitment.nowEnrolling;
        let message = '';
        if (nowEnrolling) {
            message = '모집중입니다.';
        } else {
            message = '모집마감했습니다.';
        }
        console.log(message, nowEnrolling);
        return { nowEnrolling, message };
    }

    // 지원하기
    static async addApplicant({ recruitmentId, applicantId }) {
        const applicant = await User.findById(applicantId);
        const recruitment = await Recruitment.findApplicant({
            recruitmentId
        });

        console.log(recruitment.applicant);
        const applicants = recruitment.applicant.find(
            (v) => v.id === applicant.id
        );

        // 게시글이 있는지 확인
        if (!recruitment) {
            const errorMessage = '삭제되었거나 등록되지 않은 게시물입니다.';
            throw new Error(errorMessage);
        }
        // 모집중인지 확인
        if (!recruitment.nowEnrolling) {
            const errorMessage = '해당 공고는 마감되었습니다.';
            throw new Error(errorMessage);
        }
        // 유저가 기존 지원자목록에 있는지 확인
        if (applicants) {
            const errorMessage = '이미 지원하셨습니다.';
            throw new Error(errorMessage);
        }

        const updatedRecruitment = await Recruitment.addApplicant({
            recruitmentId,
            applicant
        });

        return updatedRecruitment;
    }

    //지원 취소하기
    static async cancleApplicant({ recruitmentId, applicantId }) {
        let applicant = await User.findById(applicantId);
        const recruitment = await Recruitment.findById({
            recruitmentId
        });
        const appliedOrNot = recruitment.applicant.indexOf(applicant._id);
        // 게시글이 있는지 확인
        if (!recruitment) {
            const errorMessage = '삭제되었거나 등록되지 않은 게시물입니다.';
            throw new Error(errorMessage);
        }
        // 모집중인지 확인
        if (!recruitment.nowEnrolling) {
            const errorMessage = '해당 공고는 마감되었습니다.';
            throw new Error(errorMessage);
        }
        // 유저가 기존 지원자목록에 있는지 확인
        if (appliedOrNot === -1) {
            const errorMessage =
                '지원하지 않으셨거나 이미 지원 취소하셨습니다.';
            throw new Error(errorMessage);
        }

        applicant = recruitment.applicant;
        applicant.splice(applicant, 1);
        // console.log(applicant);
        const updatedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            { applicant }
        );
        // console.log(updatedRecruitment);
        return updatedRecruitment;
    }

    // 멤버 승인하기
    static async setMember({ recruitmentId, applicantId, user_id }) {
        let recruitment = await Recruitment.findById({ recruitmentId });
        if (!recruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        if (recruitment.captain.id !== user_id) {
            const errorMessage = '권한이 없는 사용자입니다.';
            throw new Error(errorMessage);
        }

        const applyUser = await User.findById(applicantId);
        if (!applyUser) {
            const errorMessage = '존재하지 않는 사용자입니다.';
            throw new Error(errorMessage);
        }

        const applyUserIndex = recruitment.applicant.indexOf(applyUser._id);

        if (applyUserIndex === -1) {
            const errorMessage = '지원하지 않은 사용자입니다.';
            throw new Error(errorMessage);
        }

        const isMemberIndex = recruitment.member.indexOf(applyUser._id);

        if (isMemberIndex !== -1) {
            const errorMessage = '이미 멤버입니다.';
            throw new Error(errorMessage);
        }

        const applicant = recruitment.applicant;
        applicant.splice(applyUserIndex, 1);
        const newApplicantValue = { applicant };

        recruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newApplicantValue
        );

        const newMemberValue = { $push: { member: applyUser } };

        recruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newMemberValue
        );

        return recruitment;
    }

    // 게시물에 좋아요 누르기
    static async likeRecruitment({ recruitmentId, user_id }) {
        let likedRecruitment = await Recruitment.findById({ recruitmentId });

        if (!likedRecruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        const user = await User.findById(user_id);

        console.log(likedRecruitment.like.indexOf(user._id));
        if (likedRecruitment.like.includes(user._id)) {
            const errorMessage = '이미 좋아요를 누른 게시물입니다.';
            throw new Error(errorMessage);
        }

        const newLikeValue = { $push: { like: user } };

        likedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newLikeValue
        );

        return likedRecruitment;
    }

    // 게시물에 좋아요 해제하기
    static async unlikeRecruitment({ recruitmentId, user_id }) {
        let unlikedRecruitment = await Recruitment.findById({ recruitmentId });

        if (!unlikedRecruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        const user = await User.findById(user_id);

        console.log(unlikedRecruitment.like.indexOf(user._id));
        const unlikedIndex = unlikedRecruitment.like.indexOf(user._id);
        if (unlikedIndex === -1) {
            const errorMessage = '좋아요를 누르지 않은 게시물입니다.';
            throw new Error(errorMessage);
        }

        const like = unlikedRecruitment.like;
        like.splice(unlikedIndex, 1);
        const newUnlikeValue = { like };

        unlikedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newUnlikeValue
        );

        return unlikedRecruitment;
    }

    // 댓글 추가하기
    static async addComment({ recruitmentId, content, user_id }) {
        if (content === null || content === undefined || content.length === 0) {
            const errorMessage = '빈칸 ㄴㄴ';
            throw new Error(errorMessage);
        }

        let recruitment = await Recruitment.findById({ recruitmentId });

        if (!recruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        const id = uuidv4();

        const user = await User.findById(user_id);

        const newCommentValue = {
            $push: { comment: { id, author: user, content } }
        };

        recruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            newCommentValue
        );

        return recruitment;
    }

    // 댓글 수정하기
    static async setComment({ recruitmentId, commentId, authorId, toUpdate }) {
        const recruitment = await Recruitment.findAuthor({ recruitmentId });
        if (!recruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        const user = await User.findById(authorId);
        // captain이 댓글쓸 때 어떻게?
        if (authorId === recruitment.captain.id) {
            console.log('[captain]! writing');
        }

        let comments = recruitment.comment.find(
            (comment) => comment.id === commentId
        );

        if (comments.length === 0) {
            const errorMessage = '없는 댓글이거나 이미 삭제되었습니다.';
            throw new Error(errorMessage);
        }

        comments = recruitment.comment.find(
            (comment) =>
                comment.id === commentId && comment.author.id === authorId
        );

        if (comments === null || comments === undefined) {
            const errorMesaage = '수정 권한이 없습니다.';
            throw new Error(errorMessage);
        }

        const comment = { id: commentId, author: user._id, ...toUpdate };
        console.log(comment);
        const updatedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            { comment }
        );
        console.log(updatedRecruitment);
        return updatedRecruitment;
    }

    //댓글 삭제하기
    static async deleteComment({ recruitmentId, commentId, authorId }) {
        const user = await User.findById(authorId);
        const recruitment = await Recruitment.findAuthor({ recruitmentId });

        if (!recruitment) {
            const errorMessage = '삭제된 게시물입니다.';
            throw new Error(errorMessage);
        }
        // commentId 로 comment 찾기
        let comment = recruitment.comment.find(
            (comment) => comment.id === commentId
        );

        if (comment.length === 0) {
            const errorMessage = '없는 댓글이거나 이미 삭제되었습니다.';
            throw new Error(errorMessage);
        }
        comment = recruitment.comment.find(
            (comment) =>
                comment.id === commentId && comment.author.id === authorId
        );
        console.log(comment);
        if (comment === null || comment === undefined) {
            const errorMesaage = '삭제 권한이 없습니다.';
            throw new Error(errorMessage);
        }

        // console.log(comments.splice(comment, 1));

        const updatedRecruitment = await Recruitment.updateArray(
            { id: recruitmentId },
            { $pull: { comment: { id: commentId } } }
        );
        console.log(updatedRecruitment);
        // return;
    }

    // 게시물 삭제하기
    static async deleteRecruitment({ recruitmentId, user_id }) {
        const recruitment = await Recruitment.findById({ recruitmentId });

        if (!recruitment) {
            const errorMessage = '존재하지 않는 게시물입니다.';
            throw new Error(errorMessage);
        }

        if (recruitment._doc.captain.id !== user_id) {
            const errorMessage = '삭제할 수 없습니다.';
            throw new Error(errorMessage);
        }

        await Recruitment.deleteById({ recruitmentId });
        return;
    }
}

export { RecruitmentService };
